# .github

FreshLink Organization 공통 설정 레포. 여기 있는 파일은 **Organization의 모든 레포에 기본값으로 적용**된다(각 레포에 같은 파일이 없을 때).

| 파일 | 역할 |
| --- | --- |
| [`profile/README.md`](profile/README.md) | https://github.com/sesac-freshlink 첫 화면에 보이는 소개 |
| [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) | 모든 레포 공통 PR 본문 양식 |
| [`ISSUE_TEMPLATE/`](ISSUE_TEMPLATE) | 기능·버그 이슈 양식 |
| [`docs/README.md`](docs/README.md) | **문서 목차.** 기획·규칙·팀원 가이드·기능이해·인수인계·할일 폴더별 문서 목록과 상태, 문서 관리 규칙 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 브랜치·커밋·PR·라벨 규칙 |
| [`claude-agents/`](claude-agents) | 팀 공용 Claude Code 에이전트·스킬·명령 md **원본**. 쓰고 싶은 레포의 `.claude/`에 복사해서 쓴다(선택). 아래 [Claude Code 에이전트](#claude-code-에이전트) 참고 |

재사용 워크플로 `.github/workflows/spring-build.yml`(각 서비스 레포가 몇 줄로 불러 쓴다). dev 배포·prod 승격이 끝나면 성공·실패를 디스코드(또는 슬랙)로 알린다(2026-10-28).

알림 액션 [`actions/notify`](actions/notify/action.yml): 조직 비밀 `DEPLOY_WEBHOOK_URL`로 결과·커밋 7자리·실행 링크를 보내고, 실패면 실패한 단계 이름과 오류 메시지(annotation, 최대 3개)를 붙인다. spring-build, frontend `frontend-deploy`, infra `dev-cluster`(prod-cluster 포함)가 작업 마지막 단계에서 `uses: sesac-freshlink/.github/actions/notify@main`으로 부른다. 비밀이 없으면 알림만 건너뛴다.

- 담당: 김진아
- 브랜치: `main` ← 작업 브랜치 (배포 없음)

---

## Claude Code 에이전트

> **선택이다.** 에이전트·스킬·명령 md 파일을 레포에 넣어 쓰는 것은 필수가 아니다. 쓰지 않아도 되고, 레포에 복사하는 PR을 올리지 않아도 된다.
>
> **2026-10-28 변경:** 처음에는 이 레포를 플러그인 마켓플레이스로 쓰고 각자 플러그인을 설치했지만, 간단한 명령도 30~40분씩 걸려서 **지금은 플러그인을 쓰지 않는다.** 에이전트 md 원본은 [`claude-agents/`](claude-agents)에 두고, 쓰고 싶은 레포의 `.claude/` 폴더에 복사해서 쓴다.

### 어떻게 쓰나

| 묶음 | 원본 | 복사할 레포 | 시작 명령 |
| --- | --- | --- | --- |
| 백엔드 | `claude-agents/backend/{agents,skills,commands}` | `gateway`, `member-service`, `inventory-service`, `order-service`, `logistics-simulator`, `common` (2차에 `notification-service`) | `/backend-pm 요청` |
| 인프라 | `claude-agents/infra/{agents,skills,commands}` | `infra`, `gitops` | `/infra-pm 요청` |
| 필요한 것만 | 위에서 골라서 | `frontend`(이미 자체 `.claude/agents/`가 있다), `.github` | |

1. 레포 루트의 `.claude/agents/`, `.claude/skills/<이름>/`, `.claude/commands/`에 복사한다(PowerShell 명령은 [`docs/팀원-가이드/ai-agents.md`](docs/팀원-가이드/ai-agents.md) 2장).
2. 그 레포 폴더에서 Claude Code 세션을 연다(데스크톱 앱에서 환경 **내 PC** + 레포 폴더, 또는 터미널에서 `claude`).
3. `/agents`로 목록을 확인하고, 에이전트 이름으로 부탁하거나 `/backend-pm 요청`처럼 명령을 쓴다. 명령 앞에 접두사는 붙지 않는다.

**빨리 끝내려면 에이전트 하나에게 직접 시킨다.** `/backend-pm`·`/infra-pm`(PM)은 에이전트를 최대 7개 차례로 불러 오래 걸리므로 여러 레포에 걸친 큰 기능에만 쓴다.

| 일의 크기 | 쓰는 법 |
| --- | --- |
| 작은 수정 | 에이전트 없이 그냥 Claude에게 부탁 |
| 리뷰·검증·설계 하나 | `backend-reviewer로 inventory-service #14 리뷰해줘` |
| 큰 기능 | `/backend-pm S-32 폐기 API 만들어줘` → 단계마다 ok |

> claude.ai 프로젝트 채팅·스레드에서는 `/agents`·`/backend-pm`이 동작하지 않는다. **내 PC에서 여는 Claude Code 세션**에서 쓴다.
>
> 원본이 바뀌면 `.github`를 `git pull`하고 같은 복사 명령을 다시 실행한다. 레포 하나에만 필요한 규칙은 `.claude/` 파일이 아니라 그 레포 `CLAUDE.md`에 쓴다.

### PM 흐름 (큰 기능)

```mermaid
flowchart TB
    REQ(["🙋 나: /backend-pm 요청 한 줄"]) --> S1

    subgraph S1["1단계 계획"]
        direction LR
        P1["planner<br/>요청 정리"] --> P2["architect<br/>설계"]
    end
    S1 --> G1{{"✅ ①<br/>이대로 구현할까요?"}}
    G1 -- ok --> S2

    subgraph S2["2단계 구현·검증"]
        direction LR
        C1["coder<br/>레포별 구현"] --> V1["verifier<br/>빌드·테스트"]
        V1 -. 실패하면 알아서 되돌림 .-> C1
    end
    S2 --> G2{{"✅ ②<br/>리뷰로 넘길까요?"}}
    G2 -- ok --> S3

    subgraph S3["3단계 리뷰"]
        direction LR
        R1["reviewer<br/>리뷰"] -. 지적 있으면 알아서 고침 .-> R2["coder → verifier"]
        R2 -.-> R1
    end
    S3 --> G3{{"✅ ③<br/>커밋하고 PR 올릴까요?"}}
    G3 -- ok --> S4["4단계<br/>브랜치·커밋·push·PR"]
    S4 --> DONE(["📬 PR 링크 + 사람이 할 일 보고"])

    classDef me fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#064e3b
    class REQ,G1,G2,G3 me
```

- **초록색 칸(요청 한 줄, ①②③)만 내 차례다.** 나머지 칸은 PM이 묻지 않고 진행한다.
- 고칠 점이 있으면 ok 대신 고칠 점을 말한다. **"끝까지 쭉"**이라고 답하면 ①②를 건너뛴다(커밋 전 ③은 그래도 묻는다).

| 묶음 | 시작 명령 | PM이 부리는 에이전트 (7개) |
| --- | --- | --- |
| 백엔드 | `/backend-pm` | backend-planner, backend-architect, common-coder, service-coder, gateway-coder, backend-verifier, backend-reviewer |
| 인프라 | `/infra-pm` | infra-planner, infra-architect, iac-coder, gitops-coder, pipeline-coder, infra-verifier, infra-reviewer |

담당: 김진아(원본 관리). 복사 명령, 에이전트별 역할, 에이전트 하나만 쓰는 법, 고치는 법, 막힐 때 해결법은 [`docs/팀원-가이드/ai-agents.md`](docs/팀원-가이드/ai-agents.md)에 있다.

### 쉽게 이해하기

| 비유 | 실제 | 위치 |
| --- | --- | --- |
| 팀장 | **PM** = 지금 대화하는 Claude(메인 세션). `/backend-pm`, `/infra-pm`으로 시작 | `.claude/commands/*-pm.md` |
| 팀장의 업무 매뉴얼 | 파이프라인 스킬 (단계 순서, 언제 확인받을지) | `.claude/skills/*-pipeline/SKILL.md` |
| 직무 설명서 | 에이전트 정의 (`.md` 파일 한 장 = 직원 한 명) | `.claude/agents/*.md` |
| 원본 보관소 | 이 레포 | `claude-agents/<묶음>/` |

- **에이전트(서브에이전트)**: `reviewer.md` 같은 파일에 "너는 리뷰만 해, 이런 걸 잡아내"라고 적어 두면, 그 설명서대로 일하는 Claude 직원이 생긴다. frontend 레포의 `.claude/agents/`(pm, architect, coder, reviewer 등 8개)도 같은 것이다.
- **왜 PM이 메인 세션인가**: 에이전트는 다른 에이전트를 부를 수 없다. 그래서 일을 나눠 주는 팀장 역할은 나와 대화하는 메인 Claude가 맡는다. `backend-planner`처럼 이름에 planner가 붙은 에이전트는 요청을 정리하는 직원일 뿐 PM이 아니다.
- **왜 레포마다 복사하나**: Claude Code는 세션을 연 레포의 `.claude/`를 자동으로 읽어서 설치가 필요 없다. 원본은 여기 한 곳에 두고 쓰는 레포에만 복사한다.
