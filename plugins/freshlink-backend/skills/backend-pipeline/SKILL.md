---
name: backend-pipeline
description: FreshLink 백엔드 작업(gateway, member-service, inventory-service, order-service, logistics-simulator, common의 Spring Boot API·엔티티·SQS 쪽지·Saga·스케줄러·인증 헤더)을 서브에이전트 파이프라인으로 진행할 때 사용한다. 사용자가 "에이전트로", "파이프라인으로" 백엔드 작업을 요청하거나 백엔드 레포에서 새 기능(S/U/C/E-xx)을 요청하면 먼저 읽는다.
---

# 백엔드 작업 파이프라인 (메인 에이전트용)

메인 세션(사용자와 직접 대화하는 에이전트)이 오케스트레이터다. 별도 orchestrator 서브에이전트 없이 Agent 도구로 아래 서브에이전트를 직접 조율한다.

## 절대 규칙

```
⛔ 남의 레포(CODEOWNERS 담당자가 사용자가 아닌 레포)의 main·dev에 push 금지. 작업 브랜치 + PR로만
⛔ git push --force, git reset --hard, git clean, 브랜치 삭제, 히스토리 재작성 금지
⛔ DB DROP / TRUNCATE / 조건 없는 DELETE, docker compose down -v, 큐 purge 금지
⛔ aws CLI로 리소스 생성·수정·삭제 금지 (Cognito 사용자·그룹 포함). 읽기도 사용자 확인 후
⛔ 비밀값(DB 비밀번호, 토스 키, AWS 키, 토큰 원문)을 커밋·출력하지 않는다
⛔ 커밋·push·PR은 사용자가 요청할 때만
```

## 팀 결정 (에이전트가 바꾸지 않는다)

| 주제 | 결정 |
| --- | --- |
| 인증 | Amazon Cognito. 프론트는 ID 토큰을 보낸다. gateway가 JWKS로 RS256·`iss`·`exp`·`token_use = id`·`aud` 검증. 역할 = `cognito:groups`(OWNER/CUSTOMER), 점포 = `custom:storeId` |
| 신원 전달 | gateway가 위조 헤더를 지우고 `X-User-Id`(sub, UUID 문자열)·`X-User-Role`·`X-Store-Id`를 붙인다. 서비스는 토큰을 다시 검증하지 않는다. 소유권 확인은 서비스 몫 |
| 재고 변경 | 전부 `inventory-commands.fifo`(그룹 = storeId) 경유. Outbox + `processed_message` 멱등 (common) |
| 실시간 재고 | MVP는 3초 폴링. SSE·WebSocket은 2순위(Redis와 함께) — 만들지 않는다 |
| 주문 저장소 | DynamoDB 도입 **검토 중, 미정**. 어느 쪽도 가정하지 않고 걸리면 사용자에게 묻는다 |
| 배포 | GitHub Actions(`.github` 재사용 워크플로) → ECR → gitops 이미지 태그 커밋 → ArgoCD → EKS. 백엔드 에이전트는 gitops·infra를 고치지 않는다 (`freshlink-infra` 몫) |
| 관측성 | Actuator·Micrometer → Prometheus(관리 포트 8081), Micrometer Tracing → Zipkin, JSON 로그(traceId) → Loki |

## 파이프라인

```
1. backend-pm        → _workspace/01_pm_brief.md
2. backend-architect → _workspace/02_architect_design.md
   [사람 승인 게이트 — 설계 요약(영향 레포·담당자, API·쪽지 형식 변경, gitops/infra 필요 사항, 미확정)을 사용자에게 제시하고 승인받는다]
3. 영향 레포별 coder (해당하는 것만)
   - common-coder   → common/*            + _workspace/03_common_summary.md   (먼저. 서비스가 새 DTO를 쓴다)
   - service-coder  → <서비스 레포>/*      + _workspace/03_<레포>_summary.md   (레포마다 한 번씩, 서로 독립이면 병렬)
   - gateway-coder  → gateway/*           + _workspace/03_gateway_summary.md
4. backend-verifier  → _workspace/04_verify_report.md (VerifyPassed 게이트)
   [사람 진행 게이트 — verifier 완료 후 자동 정지. 결과를 보여 주고 리뷰로 넘어갈지 묻는다]
5. backend-reviewer  → _workspace/05_reviewer_report.md (APPROVED 게이트)
6. 문서 반영: README API 표·데이터 모델이 바뀌면 해당 coder를 다시 불러 반영한다 (별도 docs 에이전트 없음)
```

작은 변경(값 하나, 오타, 한두 줄)은 파이프라인 없이 직접 고치고 verifier 게이트만 돌려도 된다. 판단이 애매하면 사용자에게 묻는다.

리뷰만 요청받으면(예: "이 PR 리뷰해줘") backend-reviewer만 부른다.

## 여러 레포 작업

백엔드 기능은 보통 레포 여러 개에 걸친다 (예: 주문 = common DTO + order-service + inventory-service + gateway 라우트). 레포는 한 폴더 아래 나란히 클론되어 있다 (예: `C:\fresh-link\repos\{gateway,member-service,inventory-service,order-service,logistics-simulator,common}`).

- `_workspace/`는 **세션을 연 레포 루트**에 만든다. 다른 레포 파일을 고쳐도 산출물은 여기 둔다.
- 순서: common → 서비스 → gateway. common 변경을 서비스에서 시험할 때는 `./gradlew publishToMavenLocal` 후 서비스가 `mavenLocal()`을 쓰게 한다 (커밋하지 않는 로컬 설정).
- 각 레포 루트 `CLAUDE.md`가 있으면 그 레포를 고치기 전에 읽는다. 레포 규칙이 이 문서보다 우선이다.
- **담당자가 다른 레포**(사용자 본인이 아닌 CODEOWNERS)를 고쳐야 하면 작업 전 사용자에게 알리고, 커밋은 `feat/<기능ID>-<설명>` 브랜치 + `dev` 대상 PR로만 한다.
- 쪽지 형식이 바뀌면 PR에 `message-spec` 라벨, 합치기 전 이태우·김경우에게 알린다.
- gitops values(환경 변수·IRSA)·infra(큐·IAM)가 필요하면 직접 고치지 말고 최종 보고에 "freshlink-infra로 할 일"로 적는다.

## 원칙

- 실질 작업(브리프, 설계, 구현, 검증, 리뷰)은 직접 하지 않고 서브에이전트에게 맡긴다. 예외: 사소한 질문, 파일 존재 확인, 한두 줄 수정.
- 시작 시 `_workspace/00_input/request.md`에 사용자 요청 원문을 저장한다. 디렉토리가 없으면 만든다. 이미 있으면 덮어쓴다. (`_workspace/`는 gitignore 대상)
- 각 단계 호출 전 필요한 입력 파일(이전 단계 산출물)이 실제로 있는지 확인한다.
- 새 요청이면 이전 산출물(01~05)은 각 단계가 덮어쓴다. 이번에 건너뛴 단계의 옛 파일(예: 이번엔 gateway 변경이 없어 남은 `03_gateway_summary.md`)은 지운다.
- "이어서/계속" 지시일 때만 마지막 완료 단계 다음부터 재개한다.
- **게이트 실패 처리:** verifier 실패 → 원인 coder로 반환. reviewer `CHANGES_REQUESTED` → coder로 반환 (설계 문제면 architect). 같은 게이트에서 3회 넘게 막히면 멈추고 사용자에게 보고한다.
- 각 서브에이전트 호출 직전, 무엇을 누구에게 맡기는지 사용자에게 한 줄로 알린다.
- 에이전트의 `model`이 적용되도록 Agent 도구 호출 시 각 에이전트 정의의 모델을 그대로 쓴다.

## 말투

- 서브에이전트 산출물(`_workspace/*.md`)과 보고는 caveman 모드: 조사·필러·인사말 없이 표·불릿·코드블록 위주.
- 레포에 커밋되는 것(README, docs/, 코드 주석, PR 본문)은 평이한 한국어 문장(`~한다` 체). 팀원이 같이 읽는다.
