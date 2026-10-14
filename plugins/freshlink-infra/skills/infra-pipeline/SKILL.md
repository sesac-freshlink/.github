---
name: infra-pipeline
description: FreshLink 인프라 작업(Terraform/infra, Helm·ArgoCD/gitops, GitHub Actions 워크플로, 관측성, Cognito, 비용·켜고 끄기 자동화)을 서브에이전트 파이프라인으로 진행할 때 사용한다. 사용자가 "에이전트로", "파이프라인으로" 인프라 작업을 요청하거나 infra·gitops·.github 레포에서 새 기능을 요청하면 먼저 읽는다.
---

# 인프라 작업 파이프라인 (메인 에이전트용)

메인 세션(사용자와 직접 대화하는 에이전트)이 오케스트레이터다. 별도 orchestrator 서브에이전트 없이 Agent 도구로 아래 서브에이전트를 직접 조율한다.

## 절대 규칙

```
⛔ terraform apply / destroy / import / state 변경 — 어떤 에이전트도 실행하지 않는다. 사람이 PR 머지 후 직접 한다
⛔ kubectl apply / delete / edit, helm install / upgrade — 클러스터에 직접 쓰지 않는다. 배포는 gitops 커밋 → ArgoCD
⛔ aws CLI로 리소스 생성·수정·삭제 금지. 읽기(describe/list/get)만, 그것도 사용자 확인 후
⛔ 비밀값(키, 비밀번호, tfvars 실값, kubeconfig, state 파일)을 커밋·출력하지 않는다
⛔ 커밋·push·PR은 사용자가 요청할 때만
```

## 파이프라인

```
1. infra-pm        → _workspace/01_pm_brief.md
2. infra-architect → _workspace/02_architect_design.md
   [사람 승인 게이트 — 설계 요약(영향 레포, 묶음, 비용 영향, 미확정)을 사용자에게 제시하고 승인받는다]
3. 영향 레포별 coder (해당하는 것만, 서로 독립이면 병렬)
   - iac-coder      → infra/*            + _workspace/03_iac_summary.md
   - gitops-coder   → gitops/*           + _workspace/03_gitops_summary.md
   - pipeline-coder → */.github/workflows + _workspace/03_pipeline_summary.md
4. infra-verifier  → _workspace/04_verify_report.md (VerifyPassed 게이트)
   [사람 진행 게이트 — verifier 완료 후 자동 정지. terraform plan이 필요하면 사람이 실행 여부를 정한다]
5. infra-reviewer  → _workspace/05_reviewer_report.md (APPROVED 게이트)
6. 문서 반영: README·docs 변경이 필요하면 해당 coder를 다시 불러 반영한다 (별도 docs 에이전트 없음)
```

작은 변경(값 하나, 오타, 한두 줄)은 파이프라인 없이 직접 고치고 verifier 게이트만 돌려도 된다. 판단이 애매하면 사용자에게 묻는다.

## 여러 레포 작업

인프라 작업은 레포 여러 개에 걸친다. 레포는 보통 한 폴더 아래 나란히 클론되어 있다 (예: `C:\fresh-link\repos\{infra,gitops,.github→dotgithub,gateway,...}`).

- `_workspace/`는 **세션을 연 레포 루트**에 만든다. 다른 레포 파일을 고쳐도 산출물은 여기 둔다.
- 레포 순서: `infra`(AWS 리소스) → `gitops`(클러스터 안) → 서비스 레포 CI 호출부. 앞 단계 출력값(ARN, 버킷 이름, IRSA Role)을 뒤 단계가 쓴다.
- 각 레포 루트 `CLAUDE.md`가 있으면 그 레포를 고치기 전에 읽는다. 레포 규칙이 이 문서보다 우선이다.
- 담당자(CODEOWNERS)가 다른 레포·폴더(서비스 코드, frontend)를 고쳐야 하면 작업 전 사용자에게 알린다.

## 원칙

- 실질 작업(브리프, 설계, 구현, 검증, 리뷰)은 직접 하지 않고 서브에이전트에게 맡긴다. 예외: 사소한 질문, 파일 존재 확인, 한두 줄 수정.
- 시작 시 `_workspace/00_input/request.md`에 사용자 요청 원문을 저장한다. 디렉토리가 없으면 만든다. 이미 있으면 덮어쓴다. (`_workspace/`는 gitignore 대상)
- 각 단계 호출 전 필요한 입력 파일(이전 단계 산출물)이 실제로 있는지 확인한다.
- 새 요청이면 이전 산출물(01~05)은 각 단계가 덮어쓴다. 이번에 건너뛴 단계의 옛 파일(예: 이번엔 gitops 변경이 없어 남은 `03_gitops_summary.md`)은 지운다.
- "이어서/계속" 지시일 때만 마지막 완료 단계 다음부터 재개한다.
- **게이트 실패 처리:** verifier 실패 → 원인 coder로 반환. reviewer `CHANGES_REQUESTED` → coder로 반환 (설계 문제면 architect). 같은 게이트에서 3회 넘게 막히면 멈추고 사용자에게 보고한다.
- 각 서브에이전트 호출 직전, 무엇을 누구에게 맡기는지 사용자에게 한 줄로 알린다.
- 에이전트의 `model`이 적용되도록 Agent 도구 호출 시 각 에이전트 정의의 모델을 그대로 쓴다.

## 말투

- 서브에이전트 산출물(`_workspace/*.md`)과 보고는 caveman 모드: 조사·필러·인사말 없이 표·불릿·코드블록 위주.
- 레포에 커밋되는 것(README, docs/, 코드 주석, PR 본문)은 평이한 한국어 문장(`~한다` 체). 팀원이 같이 읽는다.
