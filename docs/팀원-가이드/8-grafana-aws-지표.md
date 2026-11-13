# 팀원 가이드 8. Grafana에서 AWS 지표 보기 (CloudWatch)

작성: 김진아 · 2026-11-02 · 대상: 이태우(inventory-service), 김경우(member·order·gateway BFF)

> **한 줄 요약:** RDS·SQS·ALB·CloudFront 지표를 AWS 콘솔에 들어가지 않고 **Grafana 대시보드 "FreshLink AWS (CloudWatch)"** 에서 본다. 여는 법은 [가이드 4](4-관측성.md)와 같다. 쪽지가 큐에 쌓이는지, DLQ에 떨어졌는지, DB가 바쁜지, 입구에서 5xx가 나는지를 한 화면에서 본다.

만드는 쪽은 infra README 4-23(읽기 전용 Role), gitops [`platform/observability/README.md`](https://github.com/sesac-freshlink/gitops/blob/main/platform/observability/README.md) 7장(데이터 소스·대시보드)에 있다. 여기는 **보는 법**만 적는다.

상태(11/13): dev·prod 둘 다 적용되어 있다(infra [#67](https://github.com/sesac-freshlink/infra/pull/67), gitops [#17](https://github.com/sesac-freshlink/gitops/pull/17)).

---

## 1. 무엇을 어디서 보나

| 보고 싶은 것 | 어디서 |
| --- | --- |
| 서비스 요청 수·응답 시간·JVM·서비스 로그·traceId | 대시보드 **FreshLink 서비스** ([가이드 4](4-관측성.md)) |
| SQS 쪽지·DLQ, RDS, ALB, CloudFront | 대시보드 **FreshLink AWS (CloudWatch)** (이 문서) |
| Lambda 로그 (가입 확인, DLQ 알림, 비용 메일) | **Explore → CloudWatch → Logs** (4장) |

AWS 지표는 Grafana가 볼 때마다 CloudWatch에서 바로 읽는다. 클러스터에 저장하지 않으므로 **클러스터를 지웠다 다시 만들어도 지난 지표가 그대로 보인다**(CloudWatch 보관 기간 안, 최근 15일은 1분 단위).

## 2. 여는 법

[가이드 4](4-관측성.md) 2장과 같다. 팀원 계정(`freshlink-dev` 프로필)으로 dev·prod 둘 다 직접 port-forward 해서 연다. 먼저 보고 싶은 환경으로 `aws eks update-kubeconfig`(가이드 4 2장)를 친 뒤 아래를 친다.

```powershell
kubectl -n observability port-forward svc/kube-prometheus-stack-grafana 3000:80   # → http://localhost:3000
```

http://localhost:3000 → 왼쪽 **Dashboards** → 폴더 **FreshLink** → **FreshLink AWS (CloudWatch)**.

## 3. 대시보드 "FreshLink AWS (CloudWatch)"

맨 위 칸 `env`는 지금 보는 클러스터 값(dev 또는 prod)이 저절로 들어간다. dev·prod가 같은 AWS 계정이라 이 값으로 그 환경의 큐·DB·ALB·CloudFront만 고른다. 개인 큐(`dev-<아이디>-…`)는 나오지 않는다.

| 묶음 | 패널 | 이렇게 읽는다 |
| --- | --- | --- |
| SQS 쪽지 (큐 3개 + DLQ 3개) | 큐별 쌓인 쪽지 | `inventory-commands`·`inventory-results`·`notification-events`에 처리 안 된 쪽지 수. 잠깐 올랐다 0으로 돌아오면 정상. **계속 늘면 받는 서비스가 멈췄거나 못 따라간다** |
| | DLQ 쪽지 수 | 3번 실패해 DLQ로 간 쪽지. **0이 아니면** 디스코드 DLQ 채널에도 알림이 온다. [가이드 6](6-디스코드-알림.md)의 DLQ 순서대로 |
| | 가장 오래된 쪽지 나이 | 큐에서 제일 오래 기다린 쪽지(초). 수십 초를 넘어 계속 오르면 리스너가 안 돈다 |
| RDS MySQL | CPU | 평소 몇 %. 오래 70%를 넘으면 느린 쿼리를 의심한다 |
| | 연결 수 | 서비스 파드 수 × Hikari 풀 크기 정도면 정상. 갑자기 0이면 DB가 꺼졌거나 서비스가 못 붙는다 |
| | 남은 저장 공간 | 줄어드는 속도를 본다 |
| ALB (gateway 입구) | 5xx 개수 | ALB가 본 5xx. 선 `gateway 5xx`는 gateway·서비스가 낸 것, `ALB 5xx`는 ALB가 직접 낸 것(gateway 파드가 없거나 시간 초과) |
| | 응답 시간 | ALB 기준 p95·평균. 서비스 대시보드의 p95와 같이 본다 |
| | 요청 수 | 들어온 요청 수 |
| CloudFront (화면 + /api) | 오류율 | 4xx·5xx 비율(%). 화면 배포 직후 오르면 프론트 배포를 의심한다 |
| | 요청 수 | 사용자 요청 수 |

- 새로 고침은 **5분**이다. 조회마다 AWS 요금이 붙어 더 짧게는 못 고르게 했다. 바로 보고 싶으면 오른쪽 위 새로 고침 버튼을 한 번 누른다.
- 시간 범위는 오른쪽 위에서 바꾼다. 지난주 일을 볼 때도 여기만 늘리면 된다.
- 패널 제목의 **i**에 마우스를 올리면 설명이 나온다.

## 4. 문제 하나 따라가기 (예: 주문했는데 재고가 안 빠진다)

1. **큐별 쌓인 쪽지**에서 `dev-inventory-commands`가 0으로 안 내려오나 본다 → 내려오지 않으면 inventory가 쪽지를 못 받고 있다.
2. **DLQ 쪽지 수**가 올랐나 본다 → 올랐으면 처리 중 3번 실패한 것이다. 그 시각을 기억한다.
3. 대시보드 **FreshLink 서비스**로 가서 같은 시각, 서비스 `inventory-service`, 로그 레벨 `ERROR`로 거른다 → 실패 로그의 traceId로 흐름을 따라간다([가이드 4](4-관측성.md) 4장).
4. RDS **연결 수**가 0이거나 **CPU**가 100%면 서비스가 아니라 DB 문제다. 김진아에게.

Lambda 로그(가입 확인 메일이 안 왔다 등)는 왼쪽 **Explore** → 데이터 소스 **CloudWatch** → 위쪽 **CloudWatch Logs** → 로그 그룹 `/aws/lambda/freshlink-dev-post-confirmation`(가입 확인), `…-dlq-alert`(DLQ 알림), `…-cost-report`(비용 메일)를 고르고 Run query.

## 5. 서비스 개발자가 할 것

| 할 것 | 이유 |
| --- | --- |
| 새 SQS 큐를 만들면 김진아에게 큐 이름을 알려 준다 | 대시보드 `queue`·`dlq` 변수가 큐 이름 목록으로 고른다. 이름을 더해야 패널에 나온다 |
| 그 밖에는 없다 | 서비스 코드·설정은 바꿀 것이 없다 |

## 6. 안 보일 때

| 증상 | 원인과 할 일 |
| --- | --- |
| 대시보드 목록에 **FreshLink AWS**가 없다 | gitops PR이 아직 안 합쳐졌거나 ArgoCD가 아직 못 맞췄다. 5분 기다리고 그래도 없으면 김진아에게 |
| 패널마다 `AccessDenied` / `no valid credential sources` | Grafana가 읽기 Role을 못 받았다. 김진아가 infra README 4-23 표대로 고친다(대개 Grafana 파드 다시 띄우기) |
| 그래프가 비어 있고 오류도 없다 | 그 시각에 자원이 꺼져 있었다(dev는 금 21:05~월 08:40 클러스터·DB 없음, 평일 밤 노드 0). 시간 범위를 켜져 있던 시각으로 |
| ALB·CloudFront 칸만 비어 있다 | 그 시각 요청이 없었다. dev 사이트를 몇 번 누르고 5분 뒤 새로 고침 |
| 내 개인 큐(`dev-<아이디>-…`)가 안 보인다 | 일부러 뺐다. 개인 큐는 AWS 콘솔 SQS에서 본다([가이드 0](0-개발환경-접속.md)) |

관련: [가이드 4 관측성](4-관측성.md), [가이드 6 디스코드 알림](6-디스코드-알림.md), [2차 사람별 할 일](../할일/2차-사람별-할-일.md) "Grafana에서 AWS 지표 보기".
