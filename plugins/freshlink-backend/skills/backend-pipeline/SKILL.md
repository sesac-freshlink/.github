---
name: backend-pipeline
description: FreshLink 백엔드 작업(gateway, member-service, inventory-service, order-service, logistics-simulator, common의 Spring Boot API·엔티티·SQS 쪽지·Saga·스케줄러·인증 헤더)을 PM 모드로 진행할 때 사용한다. 사용자가 /backend-pm을 실행했거나 "PM으로", "에이전트로", "파이프라인으로" 백엔드 작업을 요청하거나 백엔드 레포에서 새 기능(S/U/C/E-xx)을 요청하면 먼저 읽는다.
---

# 백엔드 작업 파이프라인 (PM 모드)

**메인 세션(사용자와 대화하는 Claude)이 PM이다.** PM은 서브에이전트에게 일을 시키고, 결과를 점검하고, 단계가 끝날 때만 사용자에게 "이대로 진행할까요?"를 묻는다. 사용자가 ok 하면 다음 단계로 넘어간다. 그 사이의 자잘한 일(파일 확인, 에이전트 호출, 실패 시 되돌려 고치기)은 묻지 않고 PM이 처리한다.

서브에이전트는 다른 서브에이전트를 부를 수 없다. 그래서 PM은 서브에이전트가 아니라 메인 세션이다. `backend-planner`는 요청을 정리하는 1단계 담당일 뿐 PM이 아니다.

## 절대 규칙

```
⛔ 남의 레포(CODEOWNERS 담당자가 사용자가 아닌 레포)의 main·dev에 push 금지. 작업 브랜치 + PR로만
⛔ git push --force, git reset --hard, git clean, 브랜치 삭제, 히스토리 재작성 금지
⛔ DB DROP / TRUNCATE / 조건 없는 DELETE, 큐 purge 금지
⛔ aws CLI로 리소스 생성·수정·삭제 금지 (Cognito 사용자·그룹 포함). 읽기도 사용자 확인 후
⛔ 비밀값(DB 비밀번호, 토스 키, AWS 키, 토큰 원문)을 커밋·출력하지 않는다
⛔ 커밋·push·PR은 확인 ③에서 사용자가 ok 한 뒤에만. 서브에이전트는 커밋하지 않는다
```

## 팀 결정 (에이전트가 바꾸지 않는다)

| 주제 | 결정 |
| --- | --- |
| 인증 | Amazon Cognito. 프론트는 ID 토큰을 보낸다. gateway가 JWKS로 RS256·`iss`·`exp`·`token_use = id`·`aud` 검증. 역할 = `cognito:groups`(OWNER/CUSTOMER), 점포 = `custom:storeId` |
| 신원 전달 | gateway가 위조 헤더를 지우고 `X-User-Id`(sub, UUID 문자열)·`X-User-Role`·`X-Store-Id`를 붙인다. 서비스는 토큰을 다시 검증하지 않는다. 소유권 확인은 서비스 몫 |
| 재고 변경 | 전부 `inventory-commands.fifo`(그룹 = storeId) 경유. Outbox + `processed_message` 멱등 (common) |
| 실시간 재고 | 점주 화면이 3초마다 `GET /owner/inventory` 조회 (폴링) |
| 주문 저장소 | DynamoDB 도입 **검토 중, 미정**. 어느 쪽도 가정하지 않고 걸리면 사용자에게 묻는다 |
| 배포 | GitHub Actions(`.github` 재사용 워크플로) → ECR → gitops 이미지 태그 커밋 → ArgoCD → EKS. 백엔드 에이전트는 gitops·infra를 고치지 않는다 (`freshlink-infra` 몫) |
| 관측성 | Actuator·Micrometer → Prometheus(앱 포트의 `/actuator/prometheus`, 관리 포트 없음. 모든 서비스 8080(dev·prod 같음), 서비스끼리는 `http://<레포>:8080`. gateway는 외부 `/actuator` 차단), Micrometer Tracing → Zipkin, JSON 로그(traceId) → Loki |

## 단계와 확인

```
1단계 계획       backend-planner → backend-architect
                 ── 확인 ① "이대로 구현할까요?"
2단계 구현·검증  common-coder → service-coder(레포별) → gateway-coder → backend-verifier
                 ── 확인 ② "검증 통과했어요. 리뷰로 넘길까요?"
3단계 리뷰       backend-reviewer → (지적 있으면 coder → verifier → reviewer 자동 반복) → 문서 반영
                 ── 확인 ③ "이대로 커밋하고 PR 올릴까요?"
4단계 커밋·PR    PM이 직접 브랜치·커밋·push·PR → 최종 보고
```

| 단계 | 부르는 에이전트 | 산출물 (`_workspace/`) | PM이 점검할 것 |
| --- | --- | --- | --- |
| 1 | `backend-planner` | `01_brief.md` | 수용 기준이 검증 가능한 문장인가, 영향 레포·담당자가 빠지지 않았나, 쪽지 형식 영향이 적혔나, 미확정이 확정처럼 쓰이지 않았나 |
| 1 | `backend-architect` | `02_architect_design.md` | 브리프의 수용 기준을 모두 다루나, API 계약·테이블·쪽지 흐름·테스트 계획·레포 순서가 있나 |
| 2 | `common-coder` | `common/*` + `03_common_summary.md` | 설계 이탈, 버전 올림, 차단 항목 |
| 2 | `service-coder` | `<서비스 레포>/*` + `03_<레포>_summary.md` | 설계 이탈, 차단 항목, 테스트를 썼나 |
| 2 | `gateway-coder` | `gateway/*` + `03_gateway_summary.md` | 설계 이탈, 차단 항목 |
| 2 | `backend-verifier` | `04_verify_report.md` | `VerifyPassed`인가. 미실행 게이트가 무엇인가 |
| 3 | `backend-reviewer` | `05_reviewer_report.md` | `APPROVED`인가 |

- coder는 영향 레포에 해당하는 것만 부른다. 순서는 common → 서비스 → gateway (서비스가 새 DTO를 쓴다). service-coder는 레포마다 한 번씩, 서로 독립이면 병렬로 부른다.
- 점검에서 모자라면 확인을 받기 전에 PM이 그 에이전트를 다시 불러 고치게 한다 (구체적인 지적을 함께 넘긴다). 2번 고쳐도 안 되면 그 상태 그대로 확인에 올리고 문제를 적는다.
- 문서 반영(3단계 끝): README API 표·데이터 모델이 바뀌면 해당 coder를 다시 불러 반영한다. 별도 docs 에이전트는 없다. `/api-table`로 README 표와 컨트롤러가 맞는지 확인할 수 있다.
- 쪽지 형식이 바뀌면 `/message-check`를 돌려 결과를 확인 ③에 함께 올린다.

## 묻지 않고 PM이 알아서 하는 것

- `_workspace/00_input/request.md`에 요청 원문 저장 (없으면 만들고, 있으면 덮어쓴다. `_workspace/`는 gitignore 대상)
- 각 단계 호출 전 입력 파일(이전 산출물)이 있는지 확인
- 에이전트 호출과 결과 점검, 점검 실패 시 다시 시키기
- **verifier 실패** → 원인 coder로 되돌려 고치고 다시 검증
- **reviewer `CHANGES_REQUESTED`** → coder로 되돌림 (설계 문제면 architect) → verifier → reviewer
- 이번에 건너뛴 단계의 옛 산출물(예: gateway 변경이 없어 남은 `03_gateway_summary.md`) 삭제
- 각 에이전트를 부르기 직전 "service-coder에게 inventory-service 폐기 API를 맡깁니다"처럼 한 줄 알림 (묻는 것이 아니다. 답을 기다리지 않는다)

같은 문제로 3번 넘게 되돌려도 안 풀리면 멈추고 사용자에게 상황과 선택지를 묻는다.

## 꼭 사용자에게 묻는 것

- 확인 ①②③ (단계 경계)
- 브리프·설계의 **미확정** 질문 (예: 주문 저장소) — 확인 ①에 함께 올린다
- **담당자가 다른 레포**(사용자 본인이 아닌 CODEOWNERS)를 고쳐야 할 때 — 확인 ①에 담당자 이름과 함께 적는다
- 쪽지 형식 변경 — 확인 ①에 적는다 (`message-spec` 라벨, 이태우·김경우 알림 필요)
- gitops values(환경 변수·IRSA)·infra(큐·IAM)가 필요할 때 — 직접 고치지 않고 확인 ①과 최종 보고에 "freshlink-infra로 할 일"로 적는다

## 확인 메시지 형식

단계가 끝나면 아래 모양으로 짧게 보여 준다. `AskUserQuestion` 도구가 있으면 선택지(진행 / 고칠 점 있음 / 멈춤)로 묻는다.

```
### ① 계획 끝 — 이대로 구현할까요?

**한 일:** backend-planner 브리프, backend-architect 설계
**요약:**
- 영향 레포: common(DISPOSE 쪽지 DTO), inventory-service(폐기 API, 이태우 담당), gateway(라우트)
- API: POST /api/owner/disposals (OWNER)
- 쪽지 형식 변경 있음 → message-spec 라벨, 이태우·김경우 알림
**정해 주세요:** (미확정 질문. 없으면 "없음")
**다음:** common-coder → service-coder(inventory-service) → gateway-coder → backend-verifier

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

확인 ③에는 레포별로 브랜치 이름, 커밋 메시지, PR 대상 브랜치, 라벨을 미리 적어 보여 준다.

- 기본: 레포마다 작업 브랜치(`feat/<기능ID>-<설명>`) → 커밋 → `git push -u origin <브랜치>` → `gh pr create --base dev`.
- 레포 `CLAUDE.md`나 `.github`의 `CONTRIBUTING.md`가 다르게 정하면 그것을 따른다. 사용자가 자기 레포를 "dev에 바로 push"하라고 하면 그렇게 한다 (남의 레포는 그래도 PR, 강제 push는 금지).
- 커밋 메시지·PR 제목: `feat:`/`fix:`/`docs:` + 한국어 요약. PR 본문은 공통 PR 템플릿을 채운다. 쪽지 형식이 바뀌면 `message-spec` 라벨.
- 레포 여러 개면 PR 본문에 서로의 PR 링크를 적고, 합치는 순서(common → 서비스 → gateway)를 적는다.
- `gh`가 없거나 로그인이 안 되어 있으면 push까지만 하고 PR 만드는 링크를 알려 준다.

### 최종 보고

- PR 링크 (레포별, 합치는 순서대로)
- 다른 담당자에게 알릴 것 (남의 레포 PR, 쪽지 형식 변경)
- freshlink-infra로 할 일 (환경 변수, 큐, IAM)
- 프론트 영향 (응답 필드가 바뀌었으면 frontend `api.ts`·MSW 수정 필요)

## 이어서 하기

- "이어서", "계속"이라고 하면 `_workspace/`를 보고 마지막으로 끝난 단계 다음부터 재개한다. 끝난 단계를 처음부터 다시 돌리지 않는다.
- 새 요청이면 이전 산출물(01~05)을 덮어쓴다. 이전 기능의 산출물을 입력으로 읽지 않는다.

## 작은 일

값 하나, 오타, 한두 줄 수정은 1단계를 건너뛰고 PM이 직접 고친 뒤 verifier만 돌린다. 그래도 확인 ③(커밋·PR)은 묻는다. 리뷰만 요청받으면(예: "이 PR 리뷰해줘") `backend-reviewer`만 부른다.

## 여러 레포 작업

백엔드 기능은 보통 레포 여러 개에 걸친다 (예: 주문 = common DTO + order-service + inventory-service + gateway 라우트). 레포는 한 폴더 아래 나란히 클론되어 있다 (예: `C:\fresh-link\repos\{gateway,member-service,inventory-service,order-service,logistics-simulator,common}`).

- `_workspace/`는 **세션을 연 레포 루트**에 만든다. 다른 레포 파일을 고쳐도 산출물은 여기 둔다.
- common 변경을 서비스에서 시험할 때는 `-SNAPSHOT` 버전으로 GitHub Packages에 올려 서비스가 그 버전을 쓰게 한다.
- 각 레포 루트 `CLAUDE.md`가 있으면 그 레포를 고치기 전에 읽는다. 레포 규칙이 이 문서보다 우선이다.

## 기타

- Agent 도구로 부를 때 각 에이전트 정의의 `model`을 그대로 쓴다.
- 서브에이전트 산출물(`_workspace/*.md`)과 서브에이전트의 보고는 caveman 모드: 조사·필러·인사말 없이 표·불릿·코드블록 위주.
- 레포에 커밋되는 것(README, docs/, 코드 주석, PR 본문)은 평이한 한국어 문장(`~한다` 체). 팀원이 같이 읽는다.
