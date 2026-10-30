# Claude Code 팀 에이전트 사용법

> **2026-10-28 변경:** 처음에는 이 레포를 Claude Code 플러그인 마켓플레이스로 쓰고 각자 플러그인을 설치했다. 간단한 명령도 30~40분씩 걸려서 **지금은 플러그인을 쓰지 않는다.** 에이전트 md 원본은 이 레포 `claude-agents/`에 두고, **각 레포의 `.claude/` 폴더에 복사해서** 쓴다. 이전에 플러그인을 설치했다면 지운다(2장 끝).

> **에이전트는 선택이다.** 에이전트·스킬·명령 md 파일을 레포에 넣어 쓰는 것은 필수가 아니다. 쓰지 않아도 되고, 레포에 복사하는 PR을 올리지 않아도 된다. 쓰고 싶은 사람·레포만 아래대로 복사한다.

이 레포의 `claude-agents/`가 팀 공용 에이전트의 **원본**이다. 각 레포는 여기서 필요한 묶음을 복사해 자기 `.claude/`에 커밋한다. 전체 흐름 그림과 PM·에이전트가 무엇인지는 [README의 "Claude Code 에이전트"](../../README.md#claude-code-에이전트)에 정리해 두었다.

| 묶음 | 원본 위치 | 복사할 레포 | 시작 명령 |
| --- | --- | --- | --- |
| 백엔드 | `claude-agents/backend/` | `gateway`, `member-service`, `inventory-service`, `order-service`, `logistics-simulator`, `common` (2차에 `notification-service`) | `/backend-pm 요청` |
| 인프라 | `claude-agents/infra/` | `infra`, `gitops` | `/infra-pm 요청` |
| (필요한 것만) | 위 둘 중 골라서 | `frontend` (이미 자체 `.claude/agents/`가 있다), `.github` | |

담당: 김진아(원본 관리). 레포에 넣을지는 그 레포 담당자가 정한다(넣지 않아도 된다).

## 한눈에 보기

**빨리 끝내려면 에이전트 하나에게 직접 시킨다. 큰 기능만 PM에게 맡긴다.**

| 일의 크기 | 쓰는 법 | 걸리는 시간 |
| --- | --- | --- |
| 값 하나, 오타, 작은 수정 | 에이전트 없이 그냥 Claude에게 부탁 | 가장 빠름 |
| 리뷰만, 검증만, 설계만 | 에이전트 하나 (`backend-reviewer로 이 PR 리뷰해줘`) — 6장 | 빠름 |
| 여러 레포에 걸친 새 기능 | PM (`/backend-pm 요청`) — 3장 | 에이전트를 최대 7개 차례로 부르므로 오래 걸린다 |

PM에게 맡기면 이렇게 흘러간다.

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

## 0. 처음이라면: 어디서 쓰나

**에이전트는 내 PC에서 여는 Claude Code 세션에서만 쓴다.**

claude.ai의 프로젝트 채팅·스레드(웹 화면에서 대화하는 곳)에서는 `/agents`, `/backend-pm` 같은 명령과 에이전트가 동작하지 않는다. 프로젝트 채팅은 계획을 세우거나 PR을 만들어 달라고 부탁하는 곳이고, 에이전트로 코드를 짜고 리뷰하는 일은 아래처럼 내 PC 세션을 열어서 한다.

### 내 PC 세션 여는 법

**A. Claude 데스크톱 앱**

1. **새 생성**(새 세션)을 누른다.
2. 환경을 클라우드가 아닌 **내 PC**로 고른다.
3. 작업할 레포 폴더를 고른다. 예: `C:\fresh-link\repos\inventory-service`
4. 입력창에 요청이나 `/backend-pm 요청 내용`을 친다.

**B. 터미널 (cmd, PowerShell, Git Bash)**

```bash
cd C:\fresh-link\repos\inventory-service
claude
```

어느 쪽이든 **레포 폴더를 열고** 시작해야 그 레포의 `CLAUDE.md`(레포 규칙)와 `.claude/`(에이전트·명령·스킬)를 읽는다. 여러 레포에 걸친 작업이면 가장 많이 고칠 레포를 연다. PM이 옆 레포(`C:\fresh-link\repos\*`)도 같이 고친다.

### 준비됐는지 확인

입력창에 `/agents`를 치면 그 레포의 에이전트 목록이 나온다. `/`를 치면 명령 목록에 `/backend-pm`(인프라 레포는 `/infra-pm`)이 보인다. 안 보이면 2장대로 그 레포에 복사했는지 본다.

## 1. 구조

**원본 (`.github` 레포)**

```
.github/
└── claude-agents/
    ├── backend/
    │   ├── agents/                   # 서브에이전트(직무 설명서) 7개
    │   ├── skills/backend-pipeline/  # PM이 따르는 진행 순서와 확인 규칙
    │   └── commands/                 # /backend-pm 외 명령 3개
    └── infra/
        ├── agents/                   # 서브에이전트 7개
        ├── skills/infra-pipeline/
        └── commands/                 # /infra-pm 외 명령 3개
```

**복사한 뒤 (각 레포)**

```
inventory-service/
├── CLAUDE.md                         # 레포 규칙 (레포마다 다르다)
└── .claude/
    ├── agents/*.md                   # ← claude-agents/backend/agents/
    ├── skills/backend-pipeline/SKILL.md
    └── commands/*.md                 # ← claude-agents/backend/commands/
```

- Claude Code는 세션을 연 레포의 `.claude/agents/`, `.claude/skills/<이름>/SKILL.md`, `.claude/commands/*.md`를 자동으로 읽는다. 설치가 필요 없다.
- 명령 이름은 파일 이름이다. `commands/backend-pm.md` → `/backend-pm`. 앞에 붙는 접두사가 없다.
- **PM = 지금 대화하는 Claude(메인 세션)** 이다. 서브에이전트는 다른 서브에이전트를 부를 수 없어서, 일을 나눠 주는 역할은 메인 세션이 맡는다. `/infra-pm`, `/backend-pm` 명령이 메인 세션을 PM으로 만든다.
- `infra-planner`, `backend-planner`는 요청을 정리하는 1단계 서브에이전트다. PM이 아니다.
- 레포마다 다른 규칙(브랜치, 검증 명령, 담당자)은 원본에 넣지 않고 각 레포 루트의 `CLAUDE.md`에 둔다.

## 2. 레포에 복사하기·갱신하기

### 처음 복사

PowerShell에서 실행한다. `$repo`만 바꾸면 된다. 레포는 `C:\fresh-link\repos\` 아래에 나란히 받아 두었다고 본다.

**백엔드 레포** (`gateway`, `member-service`, `inventory-service`, `order-service`, `logistics-simulator`, `common`)

```powershell
$repo = "inventory-service"
$src  = "C:\fresh-link\repos\.github\claude-agents\backend"
$dst  = "C:\fresh-link\repos\$repo\.claude"
New-Item -ItemType Directory -Force "$dst\agents", "$dst\commands", "$dst\skills" | Out-Null
Copy-Item "$src\agents\*.md"   "$dst\agents\"   -Force
Copy-Item "$src\commands\*.md" "$dst\commands\" -Force
Copy-Item "$src\skills\*"      "$dst\skills\"   -Recurse -Force
```

**인프라 레포** (`infra`, `gitops`)

```powershell
$repo = "infra"
$src  = "C:\fresh-link\repos\.github\claude-agents\infra"
$dst  = "C:\fresh-link\repos\$repo\.claude"
New-Item -ItemType Directory -Force "$dst\agents", "$dst\commands", "$dst\skills" | Out-Null
Copy-Item "$src\agents\*.md"   "$dst\agents\"   -Force
Copy-Item "$src\commands\*.md" "$dst\commands\" -Force
Copy-Item "$src\skills\*"      "$dst\skills\"   -Recurse -Force
```

복사한 뒤:

1. 그 레포 `.gitignore`에 `_workspace*/`와 `.claude/settings.local.json`이 있는지 본다(에이전트 작업 파일과 개인 설정은 커밋하지 않는다).
2. (선택) 작업 브랜치(`chore/claude-agents`)에서 `.claude/`를 커밋하고 PR로 올린다. 레포에 같이 두면 팀원 모두 같은 에이전트를 쓴다. 나만 쓸 거면 커밋하지 않고 내 PC에만 둬도 된다.
3. 새 세션을 열고 `/agents`로 확인한다.

`frontend`는 이미 자체 `.claude/agents/`(pm, architect, coder, reviewer 등)가 있다. 백엔드 묶음을 통째로 넣지 않고 필요한 파일만 고른다. 이름이 겹치면 frontend 것을 그대로 둔다.

### 원본이 바뀌었을 때 (갱신 규칙)

1. 에이전트를 고칠 때는 **`.github`의 `claude-agents/` 원본을 먼저 고친다**(7장). 각 레포 `.claude/`만 고치면 다음 복사 때 덮어써진다.
2. 원본이 `main`에 합쳐지면, 에이전트를 쓰는 레포에서 `.github`를 `git pull`한 뒤 위 복사 명령을 다시 실행한다(레포에 커밋해 두었다면 PR로 올린다).
3. 레포 하나에만 필요한 규칙은 `.claude/` 파일이 아니라 그 레포 `CLAUDE.md`에 쓴다. 그래야 복사할 때 지워지지 않는다.

### 예전에 플러그인을 설치했다면

일반 터미널에서 지운다. 남겨 두면 레포의 `.claude/` 명령과 이름이 겹친다.

```bash
claude plugin uninstall freshlink-backend@freshlink
```

```bash
claude plugin uninstall freshlink-infra@freshlink
```

```bash
claude plugin marketplace remove freshlink
```

## 3. PM에게 맡기기

PM은 에이전트를 최대 7개 차례로 부르므로 **오래 걸린다.** 여러 레포에 걸친 새 기능처럼 큰 일에만 쓴다. 작은 일은 6장처럼 에이전트 하나에게 시키거나 그냥 Claude에게 부탁한다.

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
- 내 레포도 PR로만 올린다 (`main`·`dev` 직접 push 금지). PR을 연 뒤 CI 빌드가 통과하면 사람이 직접 합친다 (CodeRabbit은 선택)
- `gh`(GitHub CLI)가 없거나 로그인이 안 되어 있으면 push까지만 하고 PR 만드는 링크를 알려 준다

### 중간에 끊겼을 때

`/backend-pm 이어서`(인프라는 `/infra-pm 이어서`)라고 하면 `_workspace/`를 보고 마지막으로 끝난 단계 다음부터 다시 시작한다. 새 요청을 하면 이전 작업 파일은 덮어쓴다.

### 작은 일

값 하나, 오타처럼 작은 수정은 PM이 계획 단계를 건너뛰고 직접 고친 뒤 검증만 돌린다. 그래도 커밋 전에는 묻는다. 처음부터 PM 없이 부탁하는 편이 더 빠르다.

## 4. 백엔드 묶음 (`claude-agents/backend`)

### 서브에이전트

PM이 알아서 부르므로 이름을 외울 필요는 없다. 확인 메시지에 나오는 이름이 무엇을 하는지 볼 때 쓴다.

| 에이전트 | 모델 | 하는 일 | 산출물 (`_workspace/`) |
| --- | --- | --- | --- |
| `backend-planner` | opus | 요청 → 기능 ID·범위·수용 기준·영향 레포·담당자·쪽지 영향 정리 | `01_brief.md` |
| `backend-architect` | opus | API 계약, 엔티티·테이블, 쪽지 흐름·멱등·Outbox, gateway 규칙, 테스트 계획, 레포 순서 | `02_architect_design.md` |
| `common-coder` | sonnet | 쪽지 DTO, Outbox 발행기, 멱등 처리, 버전 관리 | `03_common_summary.md` |
| `service-coder` | sonnet | member·inventory·order·logistics-simulator·notification(2차) 코드와 테스트 (레포 하나씩) | `03_<레포>_summary.md` |
| `gateway-coder` | sonnet | gateway 라우팅, Cognito 토큰 검증(JWKS·aud), OWNER 확인, 위조 헤더 제거·헤더 주입, 2차 BFF(`/api/auth/**`·쿠키) | `03_gateway_summary.md` |
| `backend-verifier` | sonnet | `./gradlew build`(테스트 포함), 정적 검사, 비밀값·금지 패턴 검색 | `04_verify_report.md` |
| `backend-reviewer` | opus | 인증·권한, 재고 정합성(FIFO·멱등·Outbox·Saga), API 계약, 운영 리뷰 | `05_reviewer_report.md` |

```
planner → architect → ① → common-coder → service-coder(레포별) → gateway-coder → verifier → ② → reviewer → 문서 반영 → ③ → 커밋·PR
```

해당 레포가 없으면 그 coder는 건너뛴다. 진행 규칙 전체는 `claude-agents/backend/skills/backend-pipeline/SKILL.md`(복사한 레포에서는 `.claude/skills/backend-pipeline/SKILL.md`)에 있다.

### 에이전트가 따르는 팀 결정

- 로그인은 Amazon Cognito. 프론트가 ID 토큰을 보내고 **gateway만** 토큰을 검증한다(JWKS, RS256, `aud`). 역할은 `cognito:groups`, 점포는 `custom:storeId`. gateway가 `X-User-Id`·`X-User-Role`·`X-Store-Id` 헤더로 넘기고, 서비스는 토큰을 다시 검증하지 않는다. 2026-10-28에 BFF 전환을 정했다(gateway가 `/api/auth/**`로 로그인을 대신하고 토큰은 HttpOnly 쿠키).
- 재고를 바꾸는 일은 전부 `inventory-commands.fifo` 쪽지로. Outbox와 멱등 처리는 common을 쓴다.
- 실시간 재고는 점주 화면이 **3초마다** `GET /owner/inventory`를 조회하는 폴링이다.
- 세 서비스(member·order·inventory) 모두 RDS MySQL + Flyway다. 주문 저장소도 MySQL로 확정했다(10/15). 주문과 outbox를 한 트랜잭션에 넣어야 하기 때문이다.
- 배포(GitHub Actions → ECR → gitops → ArgoCD)와 관측성 설정(gitops)은 인프라 에이전트 몫이다. 백엔드 PM은 필요한 환경 변수·권한을 "인프라 쪽 할 일"로 알려 준다.

### 절대 하지 않는 것

- `main`·`dev`에 직접 push (자기 레포 포함) — 작업 브랜치 + PR로만
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

## 5. 인프라 묶음 (`claude-agents/infra`)

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

진행 규칙 전체는 `claude-agents/infra/skills/infra-pipeline/SKILL.md`(복사한 레포에서는 `.claude/skills/infra-pipeline/SKILL.md`)에 있다.

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

### 검증 도구

verifier는 아래 도구가 있으면 실행하고, 없으면 "미실행"으로 적는다 (자동으로 설치하지 않는다).

`terraform`, `tflint`, `trivy`(또는 `checkov`), `helm`, `kubeconform`, `actionlint`

## 6. 에이전트 하나만 쓰기 (빠른 방법)

PM 없이 한 가지 일만 시키고 싶을 때는 에이전트 이름을 넣어 부탁한다. 입력창에 `@`를 치면 에이전트 목록이 나온다.

| 하고 싶은 일 | 예시 |
| --- | --- |
| PR 리뷰만 | `backend-reviewer로 inventory-service #14 리뷰해줘` / `infra-reviewer로 이 PR 리뷰해줘` |
| 검증만 | `backend-verifier로 지금 변경분 검증해줘` / `infra-verifier로 gitops 차트 렌더링 확인해줘` |
| 설계만 보고 싶다 | `backend-architect로 E-02 주문 Saga 상태 전이 설계해줘` |
| 코드 하나만 | `service-coder로 order-service에 주문 취소 API 만들어줘` |

혼자 부를 때는 앞 단계 산출물이 없을 수 있으니 무엇을 보면 되는지(레포, 파일, PR 번호, 기능 ID)를 같이 말한다.

## 7. 에이전트 고치기·추가하기

1. 이 레포(`.github`)에서 `chore/<설명>` 브랜치를 딴다 (`main`에 바로 push하지 않고 PR로 합친다).
2. 고칠 곳을 고른다.
   - 단계 순서, 확인을 언제 묻는지, PM이 알아서 할 일 → `claude-agents/<묶음>/skills/*-pipeline/SKILL.md`
   - 특정 에이전트가 반복하는 실수 → `claude-agents/<묶음>/agents/<이름>.md`의 "작업 원칙"에 한 줄
   - 레포 하나에만 해당하는 규칙 → 그 레포의 `CLAUDE.md`
3. 새 에이전트는 `agents/`에 파일을 만든다. 맨 위 `name`, `description`, `model`이 필요하다. 파이프라인 스킬의 단계 표에도 한 줄 추가해야 PM이 부른다.
4. 합친 뒤 에이전트를 쓰는 레포는 2장 복사 명령을 다시 실행한다(레포에 커밋해 두었다면 PR로). 팀 채널에 "에이전트 원본이 바뀌었다"고 한 줄 알린다.

## 8. 자주 막히는 것

| 증상 | 해결 |
| --- | --- |
| 프로젝트 채팅에서 `/backend-pm`이 안 된다 | 정상이다. 내 PC 세션(0장)에서 쓴다 |
| `/backend-pm`이 명령 목록에 없다 | 그 레포에 `.claude/commands/backend-pm.md`가 있는지 본다. 없으면 2장대로 복사. 있으면 레포 폴더를 열고 새 세션을 연다 |
| `/agents`에 에이전트가 없다 | `.claude/agents/*.md`가 있는지, 세션을 그 레포 폴더에서 열었는지 본다 |
| 명령이 두 개씩 보이거나 `freshlink-backend:`가 붙은 명령이 보인다 | 예전 플러그인이 남아 있다. 2장 끝의 명령으로 지운다 |
| PM이 너무 오래 걸린다 | 정상이다(에이전트 여러 개를 차례로 부른다). 작은 일은 6장처럼 에이전트 하나에게, 또는 그냥 Claude에게 부탁한다 |
| PM이 확인 없이 계속 간다 / 매번 묻는다 | `/backend-reread`(인프라 `/reread`)로 스킬을 다시 읽게 한다 |
| PM이 에이전트를 안 쓰고 직접 코드를 짠다 | "backend-pipeline 스킬대로 서브에이전트에게 맡겨"라고 말한다 |
| 팀원이 고친 에이전트가 반영 안 된다 | `.github`를 `git pull`하고 2장 복사 명령을 다시 실행한 뒤 새 세션 |
| 에이전트가 레포 규칙을 무시한다 | 레포 폴더를 열고 세션을 시작했는지 확인, `/backend-reread` 또는 `/reread` |
