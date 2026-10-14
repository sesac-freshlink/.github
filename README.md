# .github

FreshLink Organization 공통 설정 레포. 여기 있는 파일은 **Organization의 모든 레포에 기본값으로 적용**된다(각 레포에 같은 파일이 없을 때).

| 파일 | 역할 |
| --- | --- |
| [`profile/README.md`](profile/README.md) | https://github.com/sesac-freshlink 첫 화면에 보이는 소개 |
| [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) | 모든 레포 공통 PR 본문 양식 |
| [`ISSUE_TEMPLATE/`](ISSUE_TEMPLATE) | 기능·버그 이슈 양식 |
| [`docs/기획안-및-설계도.md`](docs/기획안-및-설계도.md) | MVP 기획안(기능·흐름·담당·데이터 모델·메시지 명세)과 인프라 산정(AWS 리소스·노드·비용·Terraform 모듈) |
| [`docs/git-계획.md`](docs/git-계획.md) | Organization·레포 구성, 브랜치·태그·CI/CD·시크릿 규칙 |
| [`docs/architecture/`](docs/architecture) | 아키텍처 구조도(PNG·SVG)와 번호별 흐름 설명, 구조도 계획([`구조도-계획.md`](docs/architecture/구조도-계획.md))과 생성 스크립트 |
| [`docs/프로젝트-보드-사용법.md`](docs/프로젝트-보드-사용법.md) | 프로젝트 보드·이슈·브랜치·커밋 연동 사용법 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 브랜치·커밋·PR·라벨 규칙 |
| [`.claude-plugin/`](.claude-plugin), [`plugins/`](plugins) | 팀 공용 Claude Code 플러그인(에이전트 묶음). 아래 "Claude Code 에이전트 쉽게 이해하기" 참고 |
| [`docs/ai-agents.md`](docs/ai-agents.md) | 플러그인(`freshlink-infra`, `freshlink-backend`) 설치·사용·수정 방법, 에이전트별 부탁하는 예 |

앞으로 추가할 것: 재사용 워크플로 `workflows/spring-build.yml`, `workflows/frontend-deploy.yml` (각 서비스 레포가 몇 줄로 불러 쓴다).

- 담당: 김진아
- 브랜치: `main` ← 작업 브랜치 (배포 없음)

---

## Claude Code 에이전트 쉽게 이해하기

### 에이전트 = 역할이 정해진 "Claude 직원"

Claude Code는 기본적으로 Claude 한 명이 모든 일을 한다. 그런데 `reviewer.md` 같은 파일에 "너는 리뷰만 해, 이런 걸 잡아내"라고 적어 두면, 메인 Claude가 일을 쪼개서 그 직원들에게 맡긴다. 이 파일 한 장이 **직무 설명서**이고, 그 설명서대로 일하는 Claude가 **에이전트(서브에이전트)**다.

frontend 레포의 `.claude/agents/`(pm, architect, coder, reviewer 등 8개)가 바로 이것이다.

### 문제: Claude는 지금 열린 폴더의 설명서만 본다

Claude는 지금 열린 레포의 `.claude/agents/`만 읽는다. frontend에 넣은 설명서는 frontend를 열었을 때만 보이고, `infra`를 열면 보이지 않는다. 이 `.github` 레포에 `.claude/agents/`를 넣어도 마찬가지로 다른 레포에서는 보이지 않는다.

인프라 작업(`infra`, `gitops`, `.github`)이나 백엔드 작업(서비스 레포 6개)처럼 여러 레포를 오가는 일은 설명서를 레포마다 복사해야 하는 문제가 생긴다.

### 플러그인 = 설명서를 묶은 "앱"

**플러그인**은 직무 설명서 여러 장을 묶은 패키지다. 앱 하나라고 생각하면 된다. 한 번 설치하면 레포 폴더가 아니라 **내 Claude Code 자체에** 깔리기 때문에, 어느 레포를 열어도 같은 직원들이 보인다.

### 마켓플레이스 = 플러그인을 받는 "앱스토어"

**마켓플레이스**는 플러그인을 내려받는 곳이다. 거창한 서버가 아니라, GitHub 레포 하나에 "여기 이런 플러그인이 있다"는 목록 파일(`.claude-plugin/marketplace.json`)만 넣으면 그 레포가 앱스토어가 된다. 우리는 **이 `.github` 레포를 앱스토어로 쓴다.**

| 비유 | 실제 | 이 레포의 위치 |
| --- | --- | --- |
| 직무 설명서 | 에이전트 정의 (`.md` 파일) | `plugins/<플러그인>/agents/*.md` |
| 앱 | 플러그인 | `plugins/<플러그인>/` |
| 앱스토어 | 마켓플레이스 | `.claude-plugin/marketplace.json` |

### 어디서 쓰나

에이전트는 **내 PC의 로컬 Claude Code 세션**에서 쓴다. Claude 데스크톱 앱에서 새 생성 → 환경 **로컬** → 레포 폴더(예: `C:\fresh-link\repos\inventory-service`)를 고르거나, 터미널에서 그 폴더로 가서 `claude`를 실행한다.

claude.ai 프로젝트 채팅·스레드에서는 `/plugin`과 에이전트가 동작하지 않는다. 프로젝트는 계획을 세우고 PR을 만들어 달라고 하는 곳이다.

### 설치 (한 번만)

일반 터미널(cmd, PowerShell)에서 실행한다. 필요한 플러그인만 깔아도 된다.

```bash
claude plugin marketplace add sesac-freshlink/.github
claude plugin install freshlink-backend@freshlink
claude plugin install freshlink-infra@freshlink
```

`claude plugin list`로 설치를 확인하고, 새 세션에서 `/agents`를 입력하거나 "쓸 수 있는 에이전트 목록 알려줘"라고 물어 에이전트가 보이는지 본다.

그다음 에이전트 이름을 넣어 부탁하면 된다.

- "backend-pm으로 재고 차감 API 계획 세워줘"
- "infra-reviewer 에이전트로 이 PR 리뷰해줘"

설명서가 바뀌면(이 레포에 PR이 합쳐지면) `claude plugin marketplace update freshlink`를 한 번 실행하고 새 세션을 연다.

### 지금 있는 플러그인

| 플러그인 | 담당 | 내용 |
| --- | --- | --- |
| `freshlink-infra` | 김진아 | 인프라 작업(Terraform, Helm·ArgoCD, GitHub Actions) 에이전트 7개 + 파이프라인 + 명령 3개 |
| `freshlink-backend` | 김진아 | 백엔드 작업(gateway, member·inventory·order-service, logistics-simulator, common) 에이전트 7개 + 파이프라인 + 명령 3개 |

에이전트마다 하는 일과 부탁하는 예, 업데이트·삭제 방법은 [`docs/ai-agents.md`](docs/ai-agents.md)에 있다.
