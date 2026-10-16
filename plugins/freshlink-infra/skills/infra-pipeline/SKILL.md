---
name: infra-pipeline
description: FreshLink 인프라 작업(Terraform/infra, Helm·ArgoCD/gitops, GitHub Actions 워크플로, 관측성, Cognito, 비용·켜고 끄기 자동화)을 PM 모드로 진행할 때 사용한다. 사용자가 /infra-pm을 실행했거나 "PM으로", "에이전트로", "파이프라인으로" 인프라 작업을 요청하거나 infra·gitops·.github 레포에서 새 기능을 요청하면 먼저 읽는다.
---

# 인프라 작업 파이프라인 (PM 모드)

**메인 세션(사용자와 대화하는 Claude)이 PM이다.** PM은 서브에이전트에게 일을 시키고, 결과를 점검하고, 단계가 끝날 때만 사용자에게 "이대로 진행할까요?"를 묻는다. 사용자가 ok 하면 다음 단계로 넘어간다. 그 사이의 자잘한 일(파일 확인, 에이전트 호출, 실패 시 되돌려 고치기)은 묻지 않고 PM이 처리한다.

서브에이전트는 다른 서브에이전트를 부를 수 없다. 그래서 PM은 서브에이전트가 아니라 메인 세션이다. `infra-planner`는 요청을 정리하는 1단계 담당일 뿐 PM이 아니다.

## 절대 규칙

```
⛔ terraform apply / destroy / import / state 변경 — 어떤 에이전트도 실행하지 않는다. 사람이 PR 머지 후 직접 한다
⛔ kubectl apply / delete / edit, helm install / upgrade — 클러스터에 직접 쓰지 않는다. 배포는 gitops 커밋 → ArgoCD
⛔ aws CLI로 리소스 생성·수정·삭제 금지. 읽기(describe/list/get)만, 그것도 사용자 확인 후
⛔ 비밀값(키, 비밀번호, tfvars 실값, kubeconfig, state 파일)을 커밋·출력하지 않는다
⛔ git push --force, git reset --hard, git clean, 브랜치 삭제, 히스토리 재작성 금지
⛔ 커밋·push·PR은 확인 ③에서 사용자가 ok 한 뒤에만. 서브에이전트는 커밋하지 않는다
```

## FreshLink 인프라 구조 (dev·prod)

환경은 dev와 prod 두 개다. 같은 Terraform 모듈과 같은 Helm 차트를 쓰고 값(변수 파일, values)만 다르다. 사실의 원천은 `.github` 레포 `docs/aws-리소스-계획.md`(2장, 6-4~6-6, 8장)와 `gitops/README.md`(3·4장)다. 문서끼리 다르면 이 둘을 따르고 사용자에게 알린다.

| 항목 | 내용 |
| --- | --- |
| infra 폴더 | `global/`, `envs/{dev,prod}/{persistent,cluster}/`, `modules/` |
| state 키 | 5개: `global`, `dev/persistent`, `dev/cluster`, `prod/persistent`, `prod/cluster` (S3 `freshlink-tfstate-<계정ID 끝 4자리>`) |
| `global` | 두 환경 공용: ECR 5개, GitHub OIDC 공급자, Terraform state 저장소, Budgets |
| `envs/<env>/persistent` | 주말에도 남는 것: VPC·서브넷, RDS, SSM 접속용 t4g.nano, Secrets Manager, S3·CloudFront, SQS, IAM, EventBridge Scheduler, Loki 로그 버킷, Cognito User Pool·트리거 Lambda |
| `envs/<env>/cluster` | 지웠다 다시 만드는 것: EKS, 노드 그룹, NAT, Helm(ArgoCD, AWS Load Balancer Controller, metrics-server, External Secrets Operator) |
| 의존 방향 | `cluster` → 같은 환경 `persistent`, 각 환경 → `global`. dev와 prod는 서로 참조하지 않는다 |
| 모듈 | dev·prod가 같은 모듈을 부른다. 차이는 변수 파일(env, CIDR, 이름 접두사, `developers` 목록, 콜백 URL)뿐이다. `if prod` 분기 금지 |
| VPC | dev `10.0.0.0/16`, prod `10.1.0.0/16` |
| 이름 | 환경 리소스는 `freshlink-<env>-<이름>` (예: `freshlink-dev-mysql`, `freshlink-prod-eks`, Cognito `freshlink-<env>-users`, IRSA `freshlink-<env>-<레포>-irsa`). ECR·Helm 릴리스·Deployment·ServiceAccount는 레포 이름 그대로. `global` 공용 리소스에는 env를 붙이지 않는다 |
| 큐 | `<env>-inventory-commands.fifo`, `<env>-inventory-results`, DLQ 2개. dev에만 개발자별 큐(`dev-<개발자>-…`). 앱은 큐 이름 앞부분을 환경 변수 `QUEUE_PREFIX`로 받는다 |
| 앱 | Spring 프로필 `dev`·`prod`, 포트 8080 하나 |
| gitops | `envs/{dev,prod}/<svc>/values.yaml`(키 구조 같고 값만 다름), `argocd/{dev,prod}/root-app.yaml` + `apps/`. `main` 브랜치만 |
| 배포 | 서비스 레포 `dev` 브랜치 push → 빌드 → ECR(태그 = 커밋 7자리) → gitops `envs/dev` 태그 커밋 → dev ArgoCD. 서비스 레포 `main` 머지 → 다시 빌드하지 않고 같은 이미지 태그를 `envs/prod`로 승격 커밋 → prod ArgoCD |
| 프론트 | `dev` 브랜치 → dev 버킷, `main` → prod 버킷 |
| CI 인증 | 서비스 CI가 맡는 GitHub OIDC Role은 두 환경 공용이다. 조직 레포의 `dev`·`main` 브랜치만 신뢰한다. `dev` 브랜치가 맡을 수 있는 Role에는 prod 쓰기 권한(prod 버킷 쓰기, prod terraform 실행 등)을 주지 않는다. Role 개수·권한 범위와 스케줄 워크플로가 쓰는 Role은 할 일 9·10에서 정함 |
| 켜고 끄기 | dev: 평일 09:00~21:00만 켠다. 금 21:00 `cluster` 삭제, 월 08:40 생성, 매일 23:00 안전 끄기. prod: 같은 워크플로·스케줄을 `env=prod`로 쓰되 평소 꺼 두고 릴리스 확인·리허설·시연 날만 켠다. prod 켜기 cron은 할 일 15에서 정할 때까지 넣지 않는다 |
| 권한 | 팀원 IAM 그룹 `freshlink-developers`는 dev 리소스만 쓴다. prod는 읽기 권한도 없다 |
| 비용 | dev·prod 합계 약 205~240 USD(5주), Budgets는 10·11월 합계 360 USD 이하 |
| infra 브랜치 | `main` ← 작업 브랜치. 환경은 브랜치가 아니라 폴더로 나눈다 |

아직 정하지 않은 값은 지어내지 않고 "할 일 N에서 정함"으로 적는다(`.github` 레포 `docs/jina/할일-목록.md`): state 키의 실제 `key` 문자열·잠금 방식·state 버킷 만드는 법(2), 팀원 IAM 그룹을 두는 묶음(2), 개발자별 큐 정확한 이름·`QUEUE_PREFIX` 형식(3·4), IRSA Role을 두는 묶음(9), OIDC Role 이름·개수·권한 범위(10), 스케줄 워크플로가 쓰는 Role(9·10), prod 켜는 방법 세부·prod 켜기 cron 여부(15).

## 단계와 확인

```
1단계 계획       infra-planner → infra-architect
                 ── 확인 ① "이대로 구현할까요?"
2단계 구현·검증  coder(iac / gitops / pipeline 중 해당하는 것) → infra-verifier
                 ── 확인 ② "검증 통과했어요. 리뷰로 넘길까요?"
3단계 리뷰       infra-reviewer → (지적 있으면 coder → verifier → reviewer 자동 반복) → 문서 반영
                 ── 확인 ③ "이대로 커밋하고 PR 올릴까요?"
4단계 커밋·PR    PM이 직접 브랜치·커밋·push·PR → 최종 보고
```

| 단계 | 부르는 에이전트 | 산출물 (`_workspace/`) | PM이 점검할 것 |
| --- | --- | --- | --- |
| 1 | `infra-planner` | `01_brief.md` | 수용 기준이 검증 가능한 문장인가, 영향 레포가 빠지지 않았나, 미확정이 확정처럼 쓰이지 않았나 |
| 1 | `infra-architect` | `02_architect_design.md` | 브리프의 수용 기준을 모두 다루나, 영향 환경(`global`/dev/prod)·루트(`envs/<env>/persistent`·`cluster`)·state 키·비용(dev·prod 합계)·주말 destroy 영향이 적혔나 |
| 2 | `iac-coder` | `infra/*` + `03_iac_summary.md` | 설계 이탈, 차단 항목 |
| 2 | `gitops-coder` | `gitops/*` + `03_gitops_summary.md` | 설계 이탈, 차단 항목 |
| 2 | `pipeline-coder` | `*/.github/workflows` + `03_pipeline_summary.md` | 설계 이탈, 차단 항목 |
| 2 | `infra-verifier` | `04_verify_report.md` | `VerifyPassed`인가. 미실행 게이트가 무엇인가 |
| 3 | `infra-reviewer` | `05_reviewer_report.md` | `APPROVED`인가 |

- coder는 영향 레포에 해당하는 것만 부른다. 서로 독립이면 병렬로 부른다. 순서가 있으면 `infra` → `gitops` → 서비스 레포 CI 호출부 (앞 단계 출력값을 뒤 단계가 쓴다). infra 안에서는 `global` → `envs/<env>/persistent` → `envs/<env>/cluster` 순서, dev 먼저.
- 점검에서 모자라면 확인을 받기 전에 PM이 그 에이전트를 다시 불러 고치게 한다 (구체적인 지적을 함께 넘긴다). 2번 고쳐도 안 되면 그 상태 그대로 확인에 올리고 문제를 적는다.
- 문서 반영(3단계 끝): README·docs가 바뀌어야 하면 해당 coder를 다시 불러 반영한다. 별도 docs 에이전트는 없다.

## 묻지 않고 PM이 알아서 하는 것

- `_workspace/00_input/request.md`에 요청 원문 저장 (없으면 만들고, 있으면 덮어쓴다. `_workspace/`는 gitignore 대상)
- 각 단계 호출 전 입력 파일(이전 산출물)이 있는지 확인
- 에이전트 호출과 결과 점검, 점검 실패 시 다시 시키기
- **verifier 실패** → 원인 coder로 되돌려 고치고 다시 검증
- **reviewer `CHANGES_REQUESTED`** → coder로 되돌림 (설계 문제면 architect) → verifier → reviewer
- 이번에 건너뛴 단계의 옛 산출물(예: gitops 변경이 없어 남은 `03_gitops_summary.md`) 삭제
- 각 에이전트를 부르기 직전 "iac-coder에게 DLQ 모듈 작성을 맡깁니다"처럼 한 줄 알림 (묻는 것이 아니다. 답을 기다리지 않는다)

같은 문제로 3번 넘게 되돌려도 안 풀리면 멈추고 사용자에게 상황과 선택지를 묻는다.

## 꼭 사용자에게 묻는 것

- 확인 ①②③ (단계 경계)
- 브리프·설계의 **미확정** 질문 — 확인 ①에 함께 올린다
- `terraform plan` 실행 여부 — AWS 계정을 읽기 때문. 확인 ②에 "plan도 돌릴까요?"로 함께 묻는다
- 담당자가 다른 레포·폴더(서비스 코드, frontend)를 고쳐야 할 때 — 확인 ①에 적는다
- 비용이 늘어나는 변경 — 확인 ①에 월 비용 영향을 적는다

## 확인 메시지 형식

단계가 끝나면 아래 모양으로 짧게 보여 준다. `AskUserQuestion` 도구가 있으면 선택지(진행 / 고칠 점 있음 / 멈춤)로 묻는다.

```
### ① 계획 끝 — 이대로 구현할까요?

**한 일:** infra-planner 브리프, infra-architect 설계
**요약:**
- 영향 레포·환경: infra(envs/dev·envs/prod persistent, modules/messaging), gitops(platform/alerts)
- 비용: 월 +0원 (SQS DLQ, CloudWatch 알람 무료 구간)
- 주말 destroy: persistent 묶음이라 영향 없음 (dev cluster 금요일 삭제와 무관)
**정해 주세요:** (미확정 질문. 없으면 "없음")
**다음:** iac-coder → gitops-coder → infra-verifier

ok / 고칠 점 / 멈춰
```

- 요약은 3~7줄. 자세한 내용은 `_workspace/` 파일 경로로 안내한다.
- 사용자에게 보여 주는 확인 메시지는 평이한 한국어 문장으로 쓴다 (caveman 아님).

### 답에 따라

| 사용자 답 | PM이 할 일 |
| --- | --- |
| "ok", "좋아", "진행", "ㅇㅇ" | 다음 단계로 |
| 고칠 점을 말함 | 해당 에이전트에게 피드백만 반영하게 다시 시키고, 같은 확인을 다시 보여 준다 |
| "멈춰", "그만" | 멈춘다. `_workspace/`는 남겨 두고 "이어서"로 재개할 수 있다고 한 줄 알린다 |
| "끝까지 쭉", "알아서 해" | 남은 확인 ①②를 건너뛰고 진행한다. **확인 ③(커밋·PR)과 위 "꼭 묻는 것"은 그래도 묻는다** |

## 4단계 커밋·PR (확인 ③에서 ok 받은 뒤)

확인 ③에는 레포별로 브랜치 이름, 커밋 메시지, PR 대상 브랜치를 미리 적어 보여 준다.

- 기본: 작업 브랜치(`feat/I-xx-설명`, 문서만이면 `docs/설명`) → 커밋 → `git push -u origin <브랜치>` → `gh pr create`.
- PR 대상: `infra`·`.github`는 `main`, `gitops`는 레포 기본 브랜치, 서비스 레포는 `dev`. 레포 `CLAUDE.md`나 `.github`의 `CONTRIBUTING.md`가 다르게 정하면 그것을 따른다.
- 커밋 메시지·PR 제목: `feat:`/`fix:`/`docs:`/`chore:` + 한국어 요약. PR 본문은 공통 PR 템플릿을 채운다. `infra` PR에는 `terraform plan` 요약을 붙인다 (`/plan-summary`, plan을 안 돌렸으면 "plan 미실행"이라고 적는다).
- **PR은 필수다.** `main`·`dev`에 직접 push하지 않는다 (강제 push도 금지). 합치기는 사람이 CodeRabbit 지적이 없고 CI 빌드가 통과한 것을 보고 직접 한다.
- `gh`가 없거나 로그인이 안 되어 있으면 push까지만 하고 PR 만드는 링크를 알려 준다.

### 최종 보고

- PR 링크 (레포별)
- 사람이 직접 할 일: PR 합치기, 합친 뒤 `terraform apply` (어느 루트에서, 순서 `global` → `envs/<env>/persistent` → `envs/<env>/cluster`. prod `cluster`는 켜는 날에만), 그 밖에 수동 작업
- 다른 담당자에게 알릴 것

## 이어서 하기

- "이어서", "계속"이라고 하면 `_workspace/`를 보고 마지막으로 끝난 단계 다음부터 재개한다. 끝난 단계를 처음부터 다시 돌리지 않는다.
- 새 요청이면 이전 산출물(01~05)을 덮어쓴다. 이전 기능의 산출물을 입력으로 읽지 않는다.

## 작은 일

값 하나, 오타, 한두 줄 수정은 1단계를 건너뛰고 PM이 직접 고친 뒤 verifier만 돌린다. 그래도 확인 ③(커밋·PR)은 묻는다. 리뷰만 요청받으면(예: "이 PR 리뷰해줘") `infra-reviewer`만 부른다.

## 여러 레포 작업

인프라 작업은 레포 여러 개에 걸친다. 레포는 보통 한 폴더 아래 나란히 클론되어 있다 (예: `C:\fresh-link\repos\{infra,gitops,.github,gateway,...}`).

- `_workspace/`는 **세션을 연 레포 루트**에 만든다. 다른 레포 파일을 고쳐도 산출물은 여기 둔다.
- 각 레포 루트 `CLAUDE.md`가 있으면 그 레포를 고치기 전에 읽는다. 레포 규칙이 이 문서보다 우선이다.

## 기타

- Agent 도구로 부를 때 각 에이전트 정의의 `model`을 그대로 쓴다.
- 서브에이전트 산출물(`_workspace/*.md`)과 서브에이전트의 보고는 caveman 모드: 조사·필러·인사말 없이 표·불릿·코드블록 위주.
- 레포에 커밋되는 것(README, docs/, 코드 주석, PR 본문)은 평이한 한국어 문장(`~한다` 체). 팀원이 같이 읽는다.
