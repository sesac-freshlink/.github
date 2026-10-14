# Claude Code 팀 플러그인 사용법

이 레포는 팀 공용 Claude Code 플러그인을 배포하는 마켓플레이스다. 에이전트·플러그인·마켓플레이스가 무엇인지는 [README의 "Claude Code 에이전트 쉽게 이해하기"](../README.md#claude-code-에이전트-쉽게-이해하기)에 비유로 정리해 두었다.

| 플러그인 | 담당 | 쓰는 레포 |
| --- | --- | --- |
| `freshlink-infra` | 김진아 | `infra`, `gitops`, `.github` 워크플로 |
| `freshlink-backend` | 김진아 | `gateway`, `member-service`, `inventory-service`, `order-service`, `logistics-simulator`, `common` |

## 0. 처음이라면: 어디서 쓰나

**에이전트는 내 PC에서 여는 "로컬" Claude Code 세션에서만 쓴다.**

claude.ai의 프로젝트 채팅·스레드(웹 화면에서 대화하는 곳)에서는 `/plugin`, `/agents`와 에이전트가 동작하지 않는다. 프로젝트 채팅은 계획을 세우거나 PR을 만들어 달라고 부탁하는 곳이고, 에이전트로 코드를 짜고 리뷰하는 일은 아래처럼 로컬 세션을 열어서 한다.

### 로컬 세션 여는 법

**A. Claude 데스크톱 앱**

1. **새 생성**(새 세션)을 누른다.
2. 환경을 **로컬**로 고른다.
3. 작업할 레포 폴더를 고른다. 예: `C:\fresh-link\repos\inventory-service`
4. 입력창에 평소처럼 말한다. 예: `backend-pm으로 재고 차감 API 계획 세워줘`

**B. 터미널 (cmd, PowerShell, Git Bash)**

```bash
cd C:\fresh-link\repos\inventory-service
claude
```

어느 쪽이든 **레포 폴더를 열고** 시작해야 그 레포의 `CLAUDE.md`(레포 규칙)를 같이 읽는다.

### 에이전트가 보이는지 확인

세션 입력창에 아래 중 하나를 입력한다.

- `/agents` — 쓸 수 있는 에이전트 목록 화면
- `쓸 수 있는 에이전트 목록 알려줘` — Claude가 말로 알려 준다

`backend-pm`, `infra-reviewer` 같은 이름이 보이면 준비 끝이다. 안 보이면 아래 설치부터 한다.

## 1. 구조

```
.github/
├── .claude-plugin/
│   └── marketplace.json              # 앱스토어 목록: 마켓플레이스 이름 "freshlink"
└── plugins/
    ├── freshlink-infra/              # 인프라 플러그인
    │   ├── .claude-plugin/plugin.json
    │   ├── agents/                   # 에이전트(직무 설명서) 7개
    │   ├── skills/infra-pipeline/    # 메인 Claude가 따르는 작업 순서
    │   └── commands/                 # 슬래시 명령 3개
    └── freshlink-backend/            # 백엔드 플러그인
        ├── .claude-plugin/plugin.json
        ├── agents/                   # 에이전트 7개
        ├── skills/backend-pipeline/  # 메인 Claude가 따르는 작업 순서
        └── commands/                 # 슬래시 명령 3개
```

플러그인에는 `CLAUDE.md`를 넣을 수 없다. 레포마다 다른 규칙(브랜치, 검증 명령, 담당자)은 각 레포 루트의 `CLAUDE.md`에 둔다.

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

## 3. 에이전트에게 일 시키는 법

에이전트 이름을 문장에 넣어 부탁하면 된다. 이름을 안 넣고 "에이전트로 이 기능 만들어줘"라고 하면 메인 Claude가 파이프라인 스킬을 읽고 순서대로 에이전트를 부른다.

```
backend-pipeline 스킬대로 에이전트를 이용해서 S-32 폐기 API 만들어줘
```

메인 Claude가 순서를 안 지키면 위처럼 스킬 이름을 직접 말하거나 `/backend-reread`(인프라는 `/reread`)를 실행한다.

## 4. freshlink-backend

### 에이전트와 부탁하는 예

| 에이전트 | 모델 | 역할 | 산출물 (`_workspace/`) | 이렇게 부탁한다 |
| --- | --- | --- | --- | --- |
| `backend-pm` | opus | 요청 → 기능 ID·범위·수용 기준·영향 레포·담당자·쪽지 영향 정리 | `01_pm_brief.md` | "backend-pm으로 재고 차감 API 계획 세워줘" / "backend-pm으로 U-21 주문 생성 요구사항 정리해줘" |
| `backend-architect` | opus | API 계약, 엔티티·테이블, 쪽지 흐름·멱등·Outbox, gateway 규칙, 테스트 계획, 레포 순서 | `02_architect_design.md` | "backend-architect로 방금 브리프 기준 설계 써줘" / "backend-architect로 E-02 주문 Saga 상태 전이 설계해줘" |
| `gateway-coder` | sonnet | gateway 라우팅, Cognito 토큰 검증(JWKS·aud), OWNER 확인, 위조 헤더 제거·헤더 주입 | `03_gateway_summary.md` | "gateway-coder로 /api/owner/disposals 라우트 추가해줘" / "gateway-coder로 X-User-Id 위조 헤더 지우는 필터 만들고 테스트까지 써줘" |
| `service-coder` | sonnet | member·inventory·order·logistics-simulator 코드와 테스트 (레포 하나씩) | `03_<레포>_summary.md` | "service-coder로 inventory-service에 S-32 폐기 API 구현해줘" / "service-coder로 logistics-simulator INBOUND 발행 API 만들어줘" |
| `common-coder` | sonnet | 쪽지 DTO, Outbox 발행기, 멱등 처리, 버전 관리 | `03_common_summary.md` | "common-coder로 DISPOSE 쪽지 DTO 추가하고 버전 올려줘" / "common-coder로 processed_message 멱등 처리 만들어줘" |
| `backend-verifier` | sonnet | `./gradlew build`(테스트 포함), 정적 검사, 비밀값·금지 패턴 검색 | `04_verify_report.md` | "backend-verifier로 지금 변경분 검증해줘" / "backend-verifier로 order-service 빌드랑 테스트 돌려줘" |
| `backend-reviewer` | opus | 인증·권한, 재고 정합성(FIFO·멱등·Outbox·Saga), API 계약, 운영 리뷰 | `05_reviewer_report.md` | "backend-reviewer로 이 PR 리뷰해줘 (inventory-service #14)" / "backend-reviewer로 현재 브랜치 변경분 리뷰해줘" |

### 작업 순서

```
pm → architect → [사람 승인] → common-coder → service-coder(레포별) → gateway-coder → verifier → [사람 확인] → reviewer
```

해당 레포가 없으면 그 coder는 건너뛴다. 순서와 규칙은 `plugins/freshlink-backend/skills/backend-pipeline/SKILL.md`에 있다.

### 에이전트가 따르는 팀 결정

- 로그인은 Amazon Cognito. 프론트가 ID 토큰을 보내고 **gateway만** 토큰을 검증한다(JWKS, RS256, `aud`). 역할은 `cognito:groups`, 점포는 `custom:storeId`. gateway가 `X-User-Id`·`X-User-Role`·`X-Store-Id` 헤더로 넘기고, 서비스는 토큰을 다시 검증하지 않는다.
- 재고를 바꾸는 일은 전부 `inventory-commands.fifo` 쪽지로. Outbox와 멱등 처리는 common을 쓴다.
- 실시간 재고는 점주 화면이 **3초마다** `GET /owner/inventory`를 조회하는 폴링이다.
- 주문 저장소에 DynamoDB를 쓸지는 **아직 정하지 않았다.** 에이전트는 어느 쪽도 가정하지 않고, 걸리면 물어본다.
- 배포(GitHub Actions → ECR → gitops → ArgoCD)와 관측성 설정(gitops)은 `freshlink-infra` 몫이다. 백엔드 에이전트는 필요한 환경 변수·권한을 "freshlink-infra로 할 일"로 알려 준다.

### 에이전트가 절대 하지 않는 것

- 담당자가 다른 레포의 `main`·`dev`에 직접 push — 작업 브랜치 + PR로만
- `git push --force`, `git reset --hard`, `git clean`, 브랜치 삭제
- DB `DROP`·`TRUNCATE`·조건 없는 `DELETE`, `docker compose down -v`
- AWS 리소스(Cognito 포함) 생성·수정·삭제, common 태그 배포
- 커밋·push·PR (사용자가 요청할 때만)

### 명령

| 명령 | 내용 | 예 |
| --- | --- | --- |
| `/backend-reread` | 레포 `CLAUDE.md`와 백엔드 파이프라인 스킬을 다시 읽고 바로 적용 | `/backend-reread` |
| `/api-table [레포]` | 컨트롤러에서 API 목록을 뽑아 README 표·gateway 라우팅과 비교 | `/api-table ../order-service` |
| `/message-check [브랜치]` | 변경분이 쪽지 형식을 바꾸는지, 라벨·알릴 사람·common 버전 정리 | `/message-check origin/dev` |

### 검증 도구

JDK 21과 각 레포의 Gradle Wrapper(`./gradlew`)가 필요하다. 레포가 아직 뼈대(빌드 파일 없음)면 verifier는 빌드 게이트를 "미실행"으로 적는다. Testcontainers·LocalStack 테스트는 Docker Desktop이 켜져 있을 때만 돈다.

## 5. freshlink-infra

### 에이전트와 부탁하는 예

| 에이전트 | 모델 | 역할 | 산출물 (`_workspace/`) | 이렇게 부탁한다 |
| --- | --- | --- | --- | --- |
| `infra-pm` | opus | 요청 → 범위·수용 기준·영향 레포·기능 ID 정리 | `01_pm_brief.md` | "infra-pm으로 SQS DLQ 알림 추가 요청 정리해줘" / "infra-pm으로 주말 NAT 끄기 작업 브리프 써줘" |
| `infra-architect` | opus | 어느 레포·묶음(`persistent`/`cluster`)·모듈에 넣을지, 비용·주말 켜고 끄기 영향, 레포 간 순서 | `02_architect_design.md` | "infra-architect로 inventory-service IRSA 설계해줘" / "infra-architect로 Loki S3 버킷을 어느 묶음에 둘지 정해줘" |
| `iac-coder` | sonnet | Terraform 작성 (`infra`) | `03_iac_summary.md` | "iac-coder로 설계대로 messaging 모듈에 DLQ 추가해줘" / "iac-coder로 order-service용 IRSA Role 만들어줘" |
| `gitops-coder` | sonnet | Helm 차트·values·ArgoCD·관측성 (`gitops`) | `03_gitops_summary.md` | "gitops-coder로 order-service values에 TOSS 시크릿 참조 추가해줘" / "gitops-coder로 Zipkin Application 추가해줘" |
| `pipeline-coder` | sonnet | GitHub Actions 재사용 워크플로·스케줄·OIDC | `03_pipeline_summary.md` | "pipeline-coder로 spring-build 재사용 워크플로 만들어줘" / "pipeline-coder로 금요일 cluster destroy 스케줄 워크플로 써줘" |
| `infra-verifier` | sonnet | fmt·validate·tflint·trivy, helm lint·kubeconform, actionlint 실행 | `04_verify_report.md` | "infra-verifier로 지금 변경분 검증해줘" / "infra-verifier로 gitops 차트 렌더링 확인해줘" |
| `infra-reviewer` | opus | 보안, 주말 destroy 안전성, 비용, GitOps·CI 규칙 리뷰 | `05_reviewer_report.md` | "infra-reviewer 에이전트로 이 PR 리뷰해줘" / "infra-reviewer로 현재 브랜치의 IAM 정책 리뷰해줘" |

### 작업 순서

```
pm → architect → [사람 승인] → 해당 coder → verifier → [사람 확인] → reviewer
```

순서와 규칙은 `plugins/freshlink-infra/skills/infra-pipeline/SKILL.md`에 있다. 메인 Claude가 인프라 작업 요청을 받으면 이 스킬을 읽고 따른다. 따르지 않으면 이렇게 요청한다.

```
infra-pipeline 스킬대로 에이전트를 이용해서 작업해
```

### 에이전트가 절대 하지 않는 것

- `terraform apply`, `destroy`, `import`, `state` 명령 — 사람이 PR을 합친 뒤 직접 한다
- `kubectl apply`, `helm install/upgrade` 같은 클러스터 직접 변경 — 배포는 gitops 커밋과 ArgoCD로만
- AWS 리소스 생성·수정·삭제
- 커밋·push·PR (사용자가 요청할 때만)

`terraform plan`은 AWS 계정을 읽으므로 verifier가 기본으로 실행하지 않는다. 필요하면 Claude가 먼저 물어본다.

### 명령

| 명령 | 내용 |
| --- | --- |
| `/reread` | 레포 `CLAUDE.md`와 파이프라인 스킬을 다시 읽고 바로 적용 |
| `/plan-summary [파일]` | `terraform plan` 결과를 PR 본문용 표로 요약 (삭제·교체 리소스를 맨 위에) |
| `/cost-check [브랜치]` | 변경분의 월 AWS 비용 영향 추정 |

다른 플러그인의 명령과 이름이 겹치면 `/freshlink-infra:reread`처럼 플러그인 이름을 앞에 붙인다.

### 검증 도구

verifier는 아래 도구가 있으면 실행하고, 없으면 "미실행"으로 적는다 (자동으로 설치하지 않는다).

`terraform`, `tflint`, `trivy`(또는 `checkov`), `helm`, `kubeconform`, `actionlint`

## 6. 에이전트 고치기·추가하기

1. 이 레포에서 `chore/<설명>` 브랜치를 딴다.
2. `plugins/<플러그인>/agents/*.md`를 고치거나 새로 만든다. 맨 위 `name`, `description`, `model`이 필요하다. `description`은 메인 Claude가 언제 이 에이전트를 부를지 정하는 기준이라 구체적으로 쓴다.
3. 크게 바꿨으면 `plugin.json`의 `version`을 올린다.
4. 확인: `claude plugin validate .` 와 `claude plugin validate plugins/<플러그인>`
5. PR을 합친 뒤 각자 `claude plugin marketplace update freshlink`.

새 플러그인을 만들려면 `plugins/` 아래에 폴더를 만들고 `.claude-plugin/marketplace.json`의 `plugins` 목록에 한 줄 추가한다.

## 7. 자주 막히는 것

| 증상 | 해결 |
| --- | --- |
| 프로젝트 채팅에서 `/plugin`이 안 된다 | 정상이다. 로컬 세션(0장)에서 쓴다 |
| `/agents`에 `backend-*`가 없다 | `claude plugin list`로 설치 확인 → 없으면 2장 설치 → 새 세션 |
| 팀원이 고친 에이전트가 반영 안 된다 | `claude plugin marketplace update freshlink` 후 새 세션 |
| 에이전트가 레포 규칙을 무시한다 | 레포 폴더를 열고 세션을 시작했는지 확인, `/backend-reread` 또는 `/reread` |
| 명령 이름이 겹친다 | `/freshlink-backend:api-table`처럼 플러그인 이름을 붙인다 |
