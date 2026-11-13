# Claude Code 작업 방식 (에이전트 하나 + 파이프라인)

> **2026-11-13 변경:** 서브에이전트 여러 개에게 일을 넘기는 방식(PM + 에이전트 7개, `/backend-pm`·`/infra-pm`)을 없앴다. 쉬운 요청도 너무 오래 걸렸기 때문이다. 원인은 위임형 협업이었다. 에이전트마다 맥락을 처음부터 다시 읽고, `_workspace/` 파일로 결과를 주고받고, PM이 그것을 다시 점검했다. 지금은 **Claude 하나(Opus 5.5)가 정해진 순서(파이프라인)대로 직접 이해 → 계획 → 구현 → 검증 → 자체 리뷰 → 커밋·PR**을 한다. 일의 크기가 작으면 무거운 단계는 건너뛴다.
>
> 이전 변경(2026-10-28): 플러그인 마켓플레이스 방식도 느려서 그만두었다.

원본은 이 레포 [`claude-agents/`](../../claude-agents)에 있고, 각 레포의 `.claude/`에 같은 파일이 커밋되어 있다. 담당: 김진아(원본 관리).

> **`frontend`는 예외다.** `frontend`는 멘토님이 만든 자체 에이전트(`.claude/agents/` 8개)와 파이프라인을 그대로 쓴다. 이 방식은 `frontend`에 넣지 않는다. `frontend` 작업은 그 레포 `CLAUDE.md`와 `docs/ai-agents.md`를 따른다.

## 한눈에 보기

| 일의 크기 | 예 | Claude가 하는 순서 | 내가 답할 것 |
| --- | --- | --- | --- |
| 작은 일 | 값 하나, 오타, 문서 몇 줄 | 이해 → 구현 → 빠른 검증 | 커밋·PR 전 ok 한 번 |
| 보통 일 | 한 레포의 API·화면·버그 하나 | 이해 → 계획 → 구현 → 검증 → 자체 리뷰 | 계획 ok, 커밋·PR ok |
| 큰 일 | 레포 여러 개, 쪽지 형식 변경, prod·비용 영향 | 위와 같음 (계획이 더 자세함) | 계획 ok, 커밋·PR ok |

```
나: inventory-service에 유통기한 지난 lot 폐기 API 만들어줘
Claude: 보통 일로 보고 계획부터 보여 드릴게요.
Claude: 계획 — 이대로 진행할까요? (바꿀 곳, API, 검증 방법, 정해 줄 것)   ← 나: ok
Claude: 코드 작성 → ./gradlew build → 실패하면 직접 고치고 다시 → diff 자체 리뷰
Claude: 커밋·PR 올릴까요? (브랜치, 커밋 메시지, 검증 결과)                ← 나: ok
Claude: PR 링크와 사람이 할 일
```

- 따로 명령을 칠 필요가 없다. 평소처럼 부탁하면 `freshlink-pipeline` 스킬을 읽고 그 순서대로 한다. 순서를 안 지키는 것 같으면 "freshlink-pipeline 스킬대로 해줘" 또는 `/reread`.
- "끝까지 쭉", "알아서 해"라고 하면 계획 확인도 건너뛴다. 커밋·PR 전 확인은 그래도 묻는다.
- 질문만 하면 파이프라인 없이 바로 답한다. "이 PR 리뷰해줘"라고 하면 리뷰 단계만 한다.

## 0. 어디서 쓰나

**내 PC에서 여는 Claude Code 세션**에서 쓴다. claude.ai 프로젝트 채팅·스레드에서는 레포의 `.claude/`를 읽지 않는다.

**A. Claude 데스크톱 앱**

1. **새 생성**(새 세션)을 누른다.
2. 환경을 **내 PC**로 고른다.
3. 작업할 레포 폴더를 고른다. 예: `C:\fresh-link\repos\inventory-service`
4. 평소처럼 부탁한다.

**B. 터미널 (PowerShell)**

```powershell
cd C:\fresh-link\repos\inventory-service
claude
```

레포 폴더를 열고 시작해야 그 레포의 `CLAUDE.md`와 `.claude/`를 읽는다. 여러 레포에 걸친 일이면 가장 많이 고칠 레포를 연다. 옆 레포(`C:\fresh-link\repos\*`)도 같은 세션에서 고친다.

## 1. 구조

```
.github/claude-agents/                       # 원본
├── settings.json                            # 모델 기본값: claude-opus-5-5
├── skills/freshlink-pipeline/
│   ├── SKILL.md                             # 크기 정하기 + 6단계 순서 + 절대 규칙 (항상 읽음)
│   ├── backend.md                           # 백엔드 팀 결정·검증 명령·리뷰 점검표 (백엔드 고칠 때만)
│   ├── infra.md                             # 인프라 구조·검증 명령·리뷰 점검표 (인프라 고칠 때만)
│   └── frontend.md                          # 프론트 검증 명령·리뷰 점검표 (frontend 고칠 때만)
└── commands/
    ├── reread.md                            # /reread : CLAUDE.md와 스킬 다시 읽기
    ├── api-table.md                         # /api-table : 컨트롤러 ↔ README API 표 비교
    ├── message-check.md                     # /message-check : 쪽지 형식 변경 확인
    ├── cost-check.md                        # /cost-check : 인프라 변경의 월 비용 추정
    └── plan-summary.md                      # /plan-summary : terraform plan을 PR 본문용 표로

<각 레포 (frontend 제외)>/
├── CLAUDE.md                                # 레포 규칙 (레포마다 다름, 스킬보다 우선)
└── .claude/
    ├── settings.json                        # ← claude-agents/settings.json
    ├── skills/freshlink-pipeline/           # ← claude-agents/skills/freshlink-pipeline/ (4개 파일 전부)
    └── commands/*.md                        # ← claude-agents/commands/
```

- **에이전트 파일은 따로 없다.** 일하는 Claude = 지금 대화하는 메인 세션이다. `.claude/settings.json`의 `"model": "claude-opus-5-5"`로 Opus 5.5가 기본이 된다(세션 안에서 `/model`로 바꿀 수 있다).
- 영역 파일(`backend.md` 등)은 그 레포를 고칠 때만 읽는다. 매번 전부 읽지 않아서 빠르다.
- 서브에이전트는 예외로만 잠깐 쓴다: 여러 레포를 동시에 **읽기만** 해서 찾을 때, 큰 일에서 독립된 리뷰가 필요할 때. 서브에이전트끼리 일을 주고받지 않고, 코드를 고치는 일은 맡기지 않는다(`SKILL.md` "서브에이전트·병렬 작업을 쓰는 경우").

> **왜 에이전트 파일(`.claude/agents/freshlink.md`) + `claude --agent`가 아닌가:** Claude Code는 에이전트를 메인 세션으로 쓰면(`--agent` 또는 settings `agent`) 그 md 본문이 Claude Code 기본 시스템 프롬프트를 **대신한다.** 도구 사용·git 안전 규칙 같은 기본 지침이 빠지므로, 메인 세션은 그대로 두고 모델만 Opus 5.5로 정한 뒤 순서는 스킬로 준다.

## 2. 레포에 넣기·갱신하기

각 레포 `.claude/`에 커밋되어 있다. 원본이 바뀌었을 때나 새 레포에 넣을 때만 아래를 실행한다. PowerShell, `$repo`만 바꾼다.

**준비:** `C:\fresh-link\repos\.github`를 `git pull` 해 둔다.

```powershell
$repo = "inventory-service"
$src  = "C:\fresh-link\repos\.github\claude-agents"
$dst  = "C:\fresh-link\repos\$repo\.claude"
New-Item -ItemType Directory -Force "$dst\commands", "$dst\skills" | Out-Null
Copy-Item "$src\settings.json"   "$dst\settings.json" -Force
Copy-Item "$src\commands\*.md"   "$dst\commands\"     -Force
Copy-Item "$src\skills\*"        "$dst\skills\"       -Recurse -Force
```

그다음 작업 브랜치(`chore/claude-pipeline`)에서 `.claude/`를 커밋하고 PR로 올린다.

### 예전 에이전트 파일 지우기 (한 번만)

예전 방식으로 내 PC에 복사해 둔 파일이 남아 있으면 옛 순서를 따를 수 있다. 각 레포에서 지운다.

```powershell
$repo = "inventory-service"
$dst  = "C:\fresh-link\repos\$repo\.claude"
Remove-Item -Recurse -Force "$dst\agents" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$dst\skills\backend-pipeline", "$dst\skills\infra-pipeline" -ErrorAction SilentlyContinue
Remove-Item -Force "$dst\commands\backend-pm.md", "$dst\commands\infra-pm.md", "$dst\commands\backend-reread.md" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "C:\fresh-link\repos\$repo\_workspace" -ErrorAction SilentlyContinue
```

플러그인을 아직 지우지 않았다면 터미널에서 `claude plugin uninstall freshlink-backend@freshlink`, `claude plugin uninstall freshlink-infra@freshlink`, `claude plugin marketplace remove freshlink`.

## 3. 고치는 법

1. **원본(`.github` `claude-agents/`)을 먼저 고치고** PR로 합친다. 각 레포 `.claude/`만 고치면 다음 복사 때 덮어써진다.
2. 무엇을 어디에 고치나:
   - 단계 순서, 크기 기준, 언제 묻는지, 절대 규칙 → `skills/freshlink-pipeline/SKILL.md`
   - 백엔드·인프라·프론트의 팀 결정, 검증 명령, 리뷰 점검표 → 같은 폴더의 `backend.md`·`infra.md`·`frontend.md`
   - 레포 하나에만 필요한 규칙 → 그 레포 `CLAUDE.md` (복사할 때 지워지지 않는다)
3. `SKILL.md`는 짧게 유지한다. 길어지면 영역 파일로 옮긴다. 매번 읽히는 파일이 길수록 느려진다.
4. 합친 뒤 2장 복사 명령으로 각 레포에 반영한다.

## 4. 막힐 때

| 증상 | 해결 |
| --- | --- |
| 작은 일인데 계획부터 길게 쓴다 | "작은 일이야, 바로 고쳐"라고 말한다. 반복되면 `SKILL.md` 0단계 표에 예를 추가한다 |
| 검증을 안 하고 끝냈다고 한다 | "4단계 검증 돌려줘". 돌리지 않은 검증을 통과라고 말하면 안 된다(`SKILL.md` 4단계) |
| 레포 규칙을 무시한다 | 레포 폴더에서 세션을 열었는지 확인하고 `/reread` |
| 모델이 Opus 5.5가 아니다 | `.claude/settings.json`이 있는지 본다. 세션 안에서 `/model`로 바꿔도 된다 |
| 옛 `/backend-pm`·`/infra-pm`이 보인다 | 2장 "예전 에이전트 파일 지우기", 플러그인 제거 |
| 서브에이전트를 자꾸 띄운다 | "서브에이전트 없이 직접 해"라고 말한다 |
