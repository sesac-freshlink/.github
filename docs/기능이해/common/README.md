# common 버전별 이해하기

> 담당: 김진아 · 갱신: 2026-10-30 · 상태: 현재

common은 inventory-service, order-service, logistics-simulator가 같이 쓰는 라이브러리다. 버전마다 무엇이 왜 바뀌었는지, 쓰는 서비스가 무엇을 해야 하는지를 한 장씩 정리했다. 사용법 자체는 [common README](https://github.com/sesac-freshlink/common/blob/dev/README.md)와 [팀원 가이드 1](../../팀원-가이드/1-common.md)에 있다.

| 버전 | 날짜 | 한 줄 요약 | 쓰는 서비스가 할 일 | 문서 |
| --- | --- | --- | --- | --- |
| v0.1.0 | 10/16 | 쪽지 DTO 7종, 공통 오류 응답 | 의존성 추가, `GlobalExceptionHandler` 작성 | [v0.1](v0.1-쪽지와-오류응답.md) |
| v0.1.1 | 10/16 | RESERVED 쪽지에 `productName` | inventory는 보낼 때 채우고, order는 저장 | [v0.1](v0.1-쪽지와-오류응답.md#v011-reserved에-productname) |
| v0.2.0 | 10/17 | Outbox 발행기, 멱등 처리 | inventory·order: Flyway 표 3개, ShedLock 빈, 설정 켜기 | [v0.2](v0.2-outbox-멱등.md) |
| v0.3.0 | 10/20 | Outbox 추적 잇기 (traceparent) | zipkin starter, `observation-enabled: true`. 표 변경 없음 | [v0.3](v0.3-추적-잇기.md) |
| v0.4.0 | 10/29 | 보낸 줄·처리 기록 자동 정리 | 버전만 올리면 된다. 표 변경 없음 | [v0.4](v0.4-보낸-줄-정리.md) |
| v0.5.0 | 10/30 | RELEASE 사유 CANCELED, 새 쪽지 RETURN | **inventory 먼저 배포**, 그 뒤 order가 보내기 시작 | [v0.5](v0.5-취소-반품-쪽지.md) |

## 버전 올릴 때 지킬 것

- 쪽지에 필드를 **더하는** 것은 안전하다. 옛 버전도 모르는 필드는 무시하고 읽는다.
- 새 `type`이나 새 enum 값을 더하면 옛 버전은 그 쪽지를 읽지 못한다. **받는 쪽을 먼저 배포**하고 보내는 쪽을 나중에 배포한다.
- 표(Flyway)가 바뀌는 버전이면 이 문서 표의 "할 일" 칸에 적는다.

## 새 버전을 낼 때 이 폴더에 할 일

1. `v0.N-<짧은-설명>.md`를 아래 틀로 하나 만든다 (100줄 안팎).
2. 위 표에 한 줄을 더한다.
3. common 레포 태그를 다는 PR과 같은 날 올린다.

틀: 1. 한 줄 요약 / 2. 왜 필요했나 / 3. 바뀐 것 / 4. 쓰는 서비스가 할 일 / 5. 배포 순서와 주의할 점 / 6. 더 읽을 곳
