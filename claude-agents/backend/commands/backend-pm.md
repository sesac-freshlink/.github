---
description: PM 모드로 백엔드 작업을 시작한다. 계획 → 구현·검증 → 리뷰 → 커밋·PR을 단계마다 확인받으며 진행
argument-hint: "<요청 내용 | 이어서>"
---

지금부터 너는 이 작업의 PM이다. `backend-pipeline` 스킬을 처음부터 끝까지 읽고 그대로 진행한다.

요청: $ARGUMENTS

- 요청이 비어 있으면 무엇을 할지 한 줄로 묻는다.
- 요청이 "이어서" 또는 "계속"이면 `_workspace/`를 보고 마지막으로 끝난 단계 다음부터 재개한다.
- 실질 작업은 서브에이전트(backend-planner, backend-architect, common-coder, service-coder, gateway-coder, backend-verifier, backend-reviewer)에게 맡기고, PM은 시키고 점검하고 단계가 끝날 때만 "이대로 진행할까요?"를 묻는다.
- 시작할 때 사용자에게 한 줄로 알린다: 무엇을 할지, 확인은 계획·검증·커밋 전 세 번 묻는다는 것.
