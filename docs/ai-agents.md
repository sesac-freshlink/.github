# Claude Code 팀 플러그인 사용법

이 레포는 팀 공용 Claude Code 플러그인을 배포하는 마켓플레이스다. 전체 흐름 그림과 PM·에이전트·플러그인이 무엇인지는 [README의 "Claude Code PM 파이프라인"](../README.md#claude-code-pm-파이프라인)에 정리해 두었다.

| 플러그인 | 담당 | 쓰는 레포 | 시작 명령 |
| --- | --- | --- | --- |
| `freshlink-infra` | 김진아 | `infra`, `gitops`, `.github` 워크플로 | `/infra-pm 요청` |
| `freshlink-backend` | 김진아 | `gateway`, `member-service`, `inventory-service`, `order-service`, `logistics-simulator`, `common` | `/backend-pm 요청` |

## 한눈에 보기

**에이전트에게 하나씩 시키지 않는다. 명령 한 줄로 PM에게 맡기고, 단계가 끝날 때마다 ok만 한다.**

```
/backend-pm S-32 폐기 API 만들어줘. 다른 점포 lot은 403
```

이렇게 치면 Claude가 PM이 되어 아래처럼 흘러간다.

```
나: /backend-pm S-32 폐기 API 만들어줘
PM: 요청 정리 → 설계까지 에이전트에게 시키고 점검함
PM: ① 계획 끝 — 이대로 구현할까요?           ← 나: ok
PM: 코드 작성 → 빌드·테스트, 실패하면 알아서 고침
PM: ② 검증 통과했어요. 리뷰로 넘길까요?      ← 나: ok
PM: 리뷰 → 지적 있으면 알아서 고치고 다시 리뷰 → 문서 반영
PM: ③ 이대로 커밋하고 PR 올릴까요?           ← 나: ok
PM: 브랜치·커밋·push·PR → PR 링크와 사람이 할 일 보고
```

내가 하는 일은 **처음 한 줄 요청과 ok 세 번**이다. 고칠 점이 있으면 ok 대신 고칠 점을 말한다.

## 0. 처음이라면: 어디서 쓰나

**에이전트는 내 PC에서 여는 Claude Code 세션에서만 쓴다.**

claude.ai의 프로젝트 채팅·스레드(웹 화면에서 대화하는 곳)에서는 `/plugin`, `/agents`, `/backend-pm` 같은 명령과 에이전트가 동작하지 않는다. 프로젝트 채팅은 계획을 세우거나 PR을 만들어 달라고 부탁하는 곳이고, 에이전트로 코드를 짜고 리뷰하는 일은 아래처럼 내 PC 세션을 열어서 한다.

### 내 PC 세션 여는 법

**A. Claude 데스크톱 앱**

1. **새 생성**(새 세션)을 누른다.
2. 환경을 클라우드가 아닌 **내 PC**로 고른다.
3. 작업할 레포 폴더를 고른다. 예: `C:\fresh-link\repos\inventory-service`
4. 입력창에 `/backend-pm 요청 내용`을 친다.

**B. 터미널 (cmd, PowerShell, Git Bash)**

```bash
cd C:\fresh-link\repos\inventory-service
claude
```

어느 쪽이든 **레포 폴더를 열고** 시작해야 그 레포의 `CLAUDE.md`(레포 규칙)를 같이 읽는다. 여러 레포에 걸친 작업이면 가장 많이 고칠 레포를 연다. PM이 옆 레포(`C:\fresh-link\repos\*`)도 같이 고친다.

### 준비됐는지 확인

입력창에 `/`를 치면 명령 목록이 나온다. `/backend-pm`, `/infra-pm`이 보이면 준비 끝이다. 안 보이면 아래 2장 설치부터 한다.

## 1. 구조

```
.github/
├── .claude-plugin/
│   └── marketplace.json              # 앱스토어 목록: 마켓플레이스 이름 "freshlink"
└── plugins/
    ├── freshlink-infra/              # 인프라 플러그인
    │   ├── .claude-plugin/plugin.json
    │   ├── agents/                   # 서브에이전트(직무 설명서) 7개
    │   ├── skills/infra-pipeline/    # PM이 따르는 진행 순서와 확인 규칙
    │   └── commands/                 # /infra-pm 외 명령 3개
    └── freshlink-backend/            # 백엔드 플러그인
        ├── .claude-plugin/plugin.json
        ├── agents/                   # 서브에이전트 7개
        ├── skills/backend-pipeline/  # PM이 따르는 진행 순서와 확인 규칙
        └── commands/                 # /backend-pm 외 명령 3개
```

- **PM = 지금 대화하는 Claude(메인 세션)** 이다. 서브에이전트는 다른 서브에이전트를 부를 수 없어서, 일을 나눠 주는 역할은 메인 세션이 맡는다. `/infra-pm`, `/backend-pm` 명령이 메인 세션을 PM으로 만든다.
- `infra-planner`, `backend-planner`는 요청을 정리하는 1단계 서브에이전트다. PM이 아니다.
- 플러그인에는 `CLAUDE.md`를 넣을 수 없다. 레포마다 다른 규칙(브랜치, 검증 명령, 담당자)은 각 레포 루트의 `CLAUDE.md`에 둔다.

## 2. 설치·업데이트·확인

터미널(cmd, PowerShell)에서 한 번 실행한다. Claude Code 세션 안이 아니라 **일반 터미널**이다.

```bash
claude plugin marketplace add sesac-freshlink/.github
```

```bash
claude plugin install freshlink-backend@freshlink
```

```bash
claude plugin install freshlink-infra@freshlink
```

자기 일에 필요한 것만 깔아도 된다 (백엔드 담당은 `freshlink-backend`만).

| 하고 싶은 것 | 터미널 | 세션 입력창 |
| --- | --- | --- |
| 설치된 플러그인 보기 | `claude plugin list` | `/plugin` |
| 이 레포가 바뀐 뒤 반영 | `claude plugin marketplace update freshlink` | `/plugin marketplace update freshlink` |
| 에이전트 목록 보기 | — | `/agents` 또는 "쓸 수 있는 에이전트 목록 알려줘" |
| 삭제 | `claude plugin uninstall freshlink-backend@freshlink` | `/plugin uninstall freshlink-backend@freshlink` |

설치는 내 컴퓨터의 Claude Code에만 적용된다. 팀원이 각자 설치해야 한다. 설치하거나 업데이트한 뒤에는 **새 세션을 연다** (이미 열린 세션에는 바로 안 보일 수 있다).

## 3. PM에게 맡기기

### 시작

```
/backend-pm U-21 주문 생성 API 만들어줘
/infra-pm SQS DLQ에 메시지 쌓이면 알림 오게 해줘
```

명령을 안 쓰고 "PM으로 S-32 폐기 API 만들어줘"라고 해도 된다. 그래도 PM처럼 움직이지 않으면 명령으로 다시 시작한다.

### 단계와 확인

| 단계 | PM이 시키는 일 | 끝나면 묻는 것 | 내가 볼 것 |
| --- | --- | --- | --- |
| 1 계획 | planner(요청 정리) → architect(설계) | ① "이대로 구현할까요?" | 영향 레포·담당자, API, 비용, **정해 달라는 질문(미확정)** |
| 2 구현·검증 | coder(레포별) → verifier(빌드·테스트·정적 검사) | ② "검증 통과했어요. 리뷰로 넘길까요?" | 바뀐 파일, 검증 결과. 인프라는 `terraform plan`을 돌릴지 |
| 3 리뷰 | reviewer → 지적 있으면 coder가 고치고 다시 검증·리뷰 → 문서 반영 | ③ "이대로 커밋하고 PR 올릴까요?" | 리뷰 결과, 레포별 브랜치 이름·커밋 메시지·PR 대상 |
| 4 커밋·PR | PM이 직접 브랜치·커밋·push·PR | (묻지 않음) | PR 링크, 사람이 할 일 |

확인 메시지는 이런 모양이다. 자세한 내용은 레포 폴더의 `_workspace/` 파일에 있다.

```
### ① 계획 끝 — 이대로 구현할까요?

한 일: backend-planner 브리프, backend-architect 설계
요약:
- 영향 레포: common(DISPOSE 쪽지 DTO), inventory-service(폐기 API, 이태우 담당), gateway(라우트)
- API: POST /api/owner/disposals (OWNER)
- 쪽지 형식 변경 있음 → message-spec 라벨, 이태우·김경우 알림
정해 주세요: 없음
다음: common-coder → service-coder(inventory-service) → gateway-coder → backend-verifier

ok / 고칠 점 / 멈춰
```

### 확인에 답하는 법

| 이렇게 답하면 | PM이 하는 일 |
| --- | --- |
| `ok`, `좋아`, `진행` | 다음 단계로 넘어간다 |
| 고칠 점 (예: "경로는 /api/owner/lots/{id}/discard로 해줘") | 해당 에이전트에게 그것만 고치게 하고 같은 확인을 다시 보여 준다 |
| `멈춰` | 멈춘다. 나중에 `/backend-pm 이어서`로 재개한다 |
| `끝까지 쭉` | 남은 확인 ①②를 건너뛴다. **커밋·PR 전 확인 ③과 꼭 물어야 하는 것은 그래도 묻는다** |

### PM이 묻지 않고 알아서 하는 것

- 요청 원문 저장, 각 에이전트 호출, 결과 점검 (모자라면 다시 시킨다)
- 빌드·테스트 실패 → coder에게 되돌려 고치고 다시 검증
- 리뷰 지적 → coder(설계 문제면 architect)에게 되돌려 고치고 다시 검증·리뷰
- 에이전트를 부를 때마다 "service-coder에게 ~를 맡깁니다"라고 한 줄 알린다. 답할 필요 없다

같은 문제로 3번 넘게 막히면 멈추고 묻는다.

### PM이 그래도 꼭 묻는 것

- 확인 ①②③
- 정해지지 않은 것
- 담당자가 다른 레포를 고쳐야 할 때
- 쪽지(SQS 메시지) 형식이 바뀔 때
- 인프라: `terraform plan` 실행(AWS 계정을 읽는다), 비용이 늘어나는 변경

### 커밋·PR은 어떻게 되나

확인 ③에서 ok 하면 PM이 레포마다 작업 브랜치를 만들어 커밋하고 push한 뒤 PR을 연다.

- 브랜치: `feat/<기능ID>-<설명>` (문서만이면 `docs/<설명>`)
- PR 대상: 서비스 레포는 `dev`, `infra`·`.github`는 `main`. 레포 `CLAUDE.md`가 다르게 정하면 그것을 따른다
- 내 레포를 PR 없이 바로 올리고 싶으면 확인 ③에 "dev에 바로 push해"라고 답한다. 남의 레포는 그래도 PR로만 올린다
- `gh`(GitHub CLI)가 없거나 로그인이 안 되어 있으면 push까지만 하고 PR 만드는 링크를 알려 준다

### 중간에 끊겼을 때

`/backend-pm 이어서`(인프라는 `/infra-pm 이어서`)라고 하면 `_workspace/`를 보고 마지막으로 끝난 단계 다음부터 다시 시작한다. 새 요청을 하면 이전 작업 파일은 덮어쓴다.

### 작은 일

값 하나, 오타처럼 작은 수정은 PM이 계획 단계를 건너뛰고 직접 고친 뒤 검증만 돌린다. 그래도 커밋 전에는 묻는다.

## 4. freshlink-backend

### 서브에이전트

PM이 알아서 부르므로 이름을 외울 필요는 없다. 확인 메시지에 나오는 이름이 무엇을 하는지 볼 때 쓴다.

| 에이전트 | 모델 | 하는 일 | 산출물 (`_workspace/`) |
| --- | --- | --- | --- |
| `backend-planner` | opus | 요청 → 기능 ID·범위·수용 기준·영향 레포·담당자·쪽지 영향 정리 | `01_brief.md` |
| `backend-architect` | opus | API 계약, 엔티티·테이블, 쪽지 흐름·멱등·Outbox, gateway 규칙, 테스트 계획, 레포 순서 | `02_architect_design.md` |
| `common-coder` | sonnet | 쪽지 DTO, Outbox 발행기, 멱등 처리, 버전 관리 | `03_common_summary.md` |
| `service-coder` | sonnet | member·inventory·order·logistics-simulator 코드와 테스트 (레포 하나씩) | `03_<레포>_summary.md` |
| `gateway-coder` | sonnet | gateway 라우팅, Cognito 토큰 검증(JWKS·aud), OWNER 확인, 위조 헤더 제거·헤더 주입 | `03_gateway_summary.md` |
| `backend-verifier` | sonnet | `./gradlew build`(테스트 포함), 정적 검사, 비밀값·금지 패턴 검색 | `04_verify_report.md` |
| `backend-reviewer` | opus | 인증·권한, 재고 정합성(FIFO·멱등·Outbox·Saga), API 계약, 운영 리뷰 | `05_reviewer_report.md` |

```
planner → architect → ① → common-coder → service-coder(레포별) → gateway-coder → verifier → ② → reviewer → 문서 반영 → ③ → 커밋·PR
```

해당 레포가 없으면 그 coder는 건너뛴다. 진행 규칙 전체는 `plugins/freshlink-backend/skills/backend-pipeline/SKILL.md`에 있다.

### 에이전트가 따르는 팀 결정

- 로그인은 Amazon Cognito. 프론트가 ID 토큰을 보내고 **gateway만** 토큰을 검증한다(JWKS, RS256, `aud`). 역할은 `cognito:groups`, 점포는 `custom:storeId`. gateway가 `X-User-Id`·`X-User-Role`·`X-Store-Id` 헤더로 넘기고, 서비스는 토큰을 다시 검증하지 않는다.
- 재고를 바꾸는 일은 전부 `inventory-commands.fifo` 쪽지로. Outbox와 멱등 처리는 common을 쓴다.
- 실시간 재고는 점주 화면이 **3초마다** `GET /owner/inventory`를 조회하는 폴링이다.
- 세 서비스(member·order·inventory) 모두 RDS MySQL + Flyway다. 주문 저장소도 MySQL로 확정했다(10/15). 주문과 outbox를 한 트랜잭션에 넣어야 하기 때문이다.
- 배포(GitHub Actions → ECR → gitops → ArgoCD)와 관측성 설정(gitops)은 `freshlink-infra` 몫이다. 백엔드 PM은 필요한 환경 변수·권한을 "freshlink-infra로 할 일"로 알려 준다.

### 절대 하지 않는 것

- 담당자가 다른 레포의 `main`·`dev`에 직접 push — 작업 브랜치 + PR로만
- `git push --force`, `git reset --hard`, `git clean`, 브랜치 삭제
- DB `DROP`·`TRUNCATE`·조건 없는 `DELETE`, 큐 purge
- AWS 리소스(Cognito 포함) 생성·수정·삭제, common 태그 배포
- 확인 ③ 전에 커밋·push·PR

### 명령

| 명령 | 내용 | 예 |
| --- | --- | --- |
| `/backend-pm <요청>` | PM 모드로 시작. `이어서`면 끊긴 곳부터 | `/backend-pm S-32 폐기 API 만들어줘` |
| `/backend-reread` | 레포 `CLAUDE.md`와 백엔드 파이프라인 스킬을 다시 읽고 바로 적용 | `/backend-reread` |
| `/api-table [레포]` | 컨트롤러에서 API 목록을 뽑아 README 표·gateway 라우팅과 비교 | `/api-table ../order-service` |
| `/message-check [브랜치]` | 변경분이 쪽지 형식을 바꾸는지, 라벨·알릴 사람·common 버전 정리 | `/message-check origin/dev` |

### 검증 도구

JDK 21과 각 레포의 Gradle Wrapper(`./gradlew`)가 필요하다. 레포가 아직 뼈대(빌드 파일 없음)면 verifier는 빌드 게이트를 "미실행"으로 적는다. Testcontainers(MySQL) 테스트는 Docker Desktop이 켜져 있을 때만 돈다. SQS는 목으로 시험한다.

## 5. freshlink-infra

### 서브에이전트

| 에이전트 | 모델 | 하는 일 | 산출물 (`_workspace/`) |
| --- | --- | --- | --- |
| `infra-planner` | opus | 요청 → 범위·수용 기준·영향 레포·기능 ID 정리 | `01_brief.md` |
| `infra-architect` | opus | 어느 레포·환경(`global`/dev/prod)·묶음(`envs/<env>/persistent`·`cluster`)·모듈에 넣을지, 비용·주말 켜고 끄기 영향, 레포 간 순서 | `02_architect_design.md` |
| `iac-coder` | sonnet | Terraform 작성 (`infra`) | `03_iac_summary.md` |
| `gitops-coder` | sonnet | Helm 차트·values·ArgoCD·관측성 (`gitops`) | `03_gitops_summary.md` |
| `pipeline-coder` | sonnet | GitHub Actions 재사용 워크플로·스케줄·OIDC | `03_pipeline_summary.md` |
| `infra-verifier` | sonnet | fmt·validate·tflint·trivy, helm lint·kubeconform, actionlint 실행 | `04_verify_report.md` |
| `infra-reviewer` | opus | 보안, 주말 destroy 안전성, 비용, GitOps·CI 규칙 리뷰 | `05_reviewer_report.md` |

```
planner → architect → ① → coder(iac / gitops / pipeline 중 해당하는 것) → verifier → ② → reviewer → 문서 반영 → ③ → 커밋·PR
```

진행 규칙 전체는 `plugins/freshlink-infra/skills/infra-pipeline/SKILL.md`에 있다.

### 절대 하지 않는 것

- `terraform apply`, `destroy`, `import`, `state` 명령 — 사람이 PR을 합친 뒤 직접 한다. PM이 최종 보고에 어느 폴더에서 apply하면 되는지 적어 준다
- `kubectl apply`, `helm install/upgrade` 같은 클러스터 직접 변경 — 배포는 gitops 커밋과 ArgoCD로만
- AWS 리소스 생성·수정·삭제
- 확인 ③ 전에 커밋·push·PR

`terraform plan`은 AWS 계정을 읽으므로 기본으로 돌리지 않는다. PM이 확인 ②에서 "plan도 돌릴까요?"라고 묻는다.

### 명령

| 명령 | 내용 |
| --- | --- |
| `/infra-pm <요청>` | PM 모드로 시작. `이어서`면 끊긴 곳부터 |
| `/reread` | 레포 `CLAUDE.md`와 파이프라인 스킬을 다시 읽고 바로 적용 |
| `/plan-summary [파일]` | `terraform plan` 결과를 PR 본문용 표로 요약 (삭제·교체 리소스를 맨 위에) |
| `/cost-check [브랜치]` | 변경분의 월 AWS 비용 영향 추정 |

다른 플러그인의 명령과 이름이 겹치면 `/freshlink-infra:reread`처럼 플러그인 이름을 앞에 붙인다.

### 검증 도구

verifier는 아래 도구가 있으면 실행하고, 없으면 "미실행"으로 적는다 (자동으로 설치하지 않는다).

`terraform`, `tflint`, `trivy`(또는 `checkov`), `helm`, `kubeconform`, `actionlint`

## 6. 에이전트 하나만 쓰기

PM 없이 한 가지 일만 시키고 싶을 때는 에이전트 이름을 넣어 부탁한다. 입력창에 `@`를 치면 에이전트 목록이 나온다.

| 하고 싶은 일 | 예시 |
| --- | --- |
| PR 리뷰만 | `backend-reviewer로 inventory-service #14 리뷰해줘` / `infra-reviewer로 이 PR 리뷰해줘` |
| 검증만 | `backend-verifier로 지금 변경분 검증해줘` / `infra-verifier로 gitops 차트 렌더링 확인해줘` |
| 설계만 보고 싶다 | `backend-architect로 E-02 주문 Saga 상태 전이 설계해줘` |

혼자 부를 때는 앞 단계 산출물이 없을 수 있으니 무엇을 보면 되는지(레포, 파일, PR 번호, 기능 ID)를 같이 말한다.

## 7. 에이전트 고치기·추가하기

1. 이 레포에서 `chore/<설명>` 브랜치를 딴다 (담당자는 `main`에 바로 push해도 된다).
2. 고칠 곳을 고른다.
   - 단계 순서, 확인을 언제 묻는지, PM이 알아서 할 일 → `plugins/<플러그인>/skills/*-pipeline/SKILL.md`
   - 특정 에이전트가 반복하는 실수 → `plugins/<플러그인>/agents/<이름>.md`의 "작업 원칙"에 한 줄
   - 레포 하나에만 해당하는 규칙 → 그 레포의 `CLAUDE.md`
3. 새 에이전트는 `agents/`에 파일을 만든다. 맨 위 `name`, `description`, `model`이 필요하다. 파이프라인 스킬의 단계 표에도 한 줄 추가해야 PM이 부른다.
4. 크게 바꿨으면 `plugin.json`의 `version`을 올린다.
5. 확인: `claude plugin validate .` 와 `claude plugin validate plugins/<플러그인>`
6. 합친 뒤 각자 `claude plugin marketplace update freshlink`, 새 세션.

새 플러그인을 만들려면 `plugins/` 아래에 폴더를 만들고 `.claude-plugin/marketplace.json`의 `plugins` 목록에 한 줄 추가한다.

## 8. 자주 막히는 것

| 증상 | 해결 |
| --- | --- |
| 프로젝트 채팅에서 `/plugin`, `/backend-pm`이 안 된다 | 정상이다. 내 PC 세션(0장)에서 쓴다 |
| `/backend-pm`이 명령 목록에 없다 | `claude plugin marketplace update freshlink` → 새 세션. 그래도 없으면 `claude plugin list`로 설치 확인 → 2장 |
| `backend-pm` 에이전트가 없어졌다 | 이름이 `backend-planner`로 바뀌었다 (인프라는 `infra-planner`). PM은 이제 명령(`/backend-pm`)이다 |
| PM이 확인 없이 계속 간다 / 매번 묻는다 | `/backend-reread`(인프라 `/reread`)로 스킬을 다시 읽게 한다 |
| PM이 에이전트를 안 쓰고 직접 코드를 짠다 | "backend-pipeline 스킬대로 서브에이전트에게 맡겨"라고 말한다 |
| 팀원이 고친 에이전트가 반영 안 된다 | `claude plugin marketplace update freshlink` 후 새 세션 |
| 에이전트가 레포 규칙을 무시한다 | 레포 폴더를 열고 세션을 시작했는지 확인, `/backend-reread` 또는 `/reread` |
| 명령 이름이 겹친다 | `/freshlink-backend:backend-pm`처럼 플러그인 이름을 붙인다 |
