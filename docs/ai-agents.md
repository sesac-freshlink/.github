# Claude Code 팀 플러그인 사용법

이 레포는 팀 공용 Claude Code 플러그인을 배포하는 마켓플레이스다. 에이전트·플러그인·마켓플레이스가 무엇인지는 [README의 "Claude Code 에이전트 쉽게 이해하기"](../README.md#claude-code-에이전트-쉽게-이해하기)에 비유로 정리해 두었다.

## 1. 구조

```
.github/
├── .claude-plugin/
│   └── marketplace.json            # 앱스토어 목록: 마켓플레이스 이름 "freshlink"
└── plugins/
    └── freshlink-infra/            # 인프라 플러그인
        ├── .claude-plugin/plugin.json
        ├── agents/                 # 에이전트(직무 설명서) 7개
        ├── skills/infra-pipeline/  # 메인 Claude가 따르는 작업 순서
        └── commands/               # 슬래시 명령 3개
```

플러그인에는 `CLAUDE.md`를 넣을 수 없다. 레포마다 다른 규칙(state 키, 브랜치, 검증 명령)은 각 레포 루트의 `CLAUDE.md`에 둔다 (`infra`, `gitops`).

## 2. 설치·업데이트·삭제

| 하고 싶은 것 | Claude Code 입력창에 |
| --- | --- |
| 처음 설치 | `/plugin marketplace add sesac-freshlink/.github` 다음 `/plugin install freshlink-infra@freshlink` |
| 이 레포가 바뀐 뒤 반영 | `/plugin marketplace update freshlink` |
| 설치된 것 보기, 끄기·켜기 | `/plugin` |
| 에이전트 목록 보기 | `/agents` |
| 삭제 | `/plugin uninstall freshlink-infra@freshlink` |

설치는 내 컴퓨터의 Claude Code에만 적용된다. 팀원이 각자 설치해야 한다. 설치하거나 업데이트한 뒤에는 새 세션을 열거나 `/reread`를 실행한다.

## 3. freshlink-infra

### 에이전트

| 에이전트 | 모델 | 역할 | 산출물 (`_workspace/`) |
| --- | --- | --- | --- |
| `infra-pm` | opus | 요청 → 범위·수용 기준·영향 레포·기능 ID 정리 | `01_pm_brief.md` |
| `infra-architect` | opus | 어느 레포·묶음(`persistent`/`cluster`)·모듈에 넣을지, 비용·주말 켜고 끄기 영향, 레포 간 순서 | `02_architect_design.md` |
| `iac-coder` | sonnet | Terraform 작성 (`infra`) | `03_iac_summary.md` |
| `gitops-coder` | sonnet | Helm 차트·values·ArgoCD·관측성 (`gitops`) | `03_gitops_summary.md` |
| `pipeline-coder` | sonnet | GitHub Actions 재사용 워크플로·스케줄·OIDC | `03_pipeline_summary.md` |
| `infra-verifier` | sonnet | fmt·validate·tflint·trivy, helm lint·kubeconform, actionlint 실행 | `04_verify_report.md` |
| `infra-reviewer` | opus | 보안, 주말 destroy 안전성, 비용, GitOps·CI 규칙 리뷰 | `05_reviewer_report.md` |

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

## 4. 에이전트 고치기·추가하기

1. 이 레포에서 `chore/<설명>` 브랜치를 딴다.
2. `plugins/<플러그인>/agents/*.md`를 고치거나 새로 만든다. 맨 위 `name`, `description`, `model`이 필요하다. `description`은 메인 Claude가 언제 이 에이전트를 부를지 정하는 기준이라 구체적으로 쓴다.
3. 크게 바꿨으면 `plugin.json`의 `version`을 올린다.
4. 확인: `claude plugin validate .` 와 `claude plugin validate plugins/<플러그인>`
5. PR을 합친 뒤 각자 `/plugin marketplace update freshlink`.

새 플러그인(예: 백엔드용)을 만들려면 `plugins/` 아래에 폴더를 만들고 `.claude-plugin/marketplace.json`의 `plugins` 목록에 한 줄 추가한다.
