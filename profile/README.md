# FreshLink 🥬

**편의점 점주와 고객이 같은 재고를 실시간으로 보는 서비스**

고객이 핸드폰으로 근처 편의점 상품을 주문·결제하면, 그 순간 점주 화면의 재고가 줄어든다. 동시에 여러 명이 사도 재고는 음수가 되지 않고, 유통기한이 지난 상품은 고객에게 팔리지 않는다.

> SeSAC 팀 프로젝트 · 5주 MVP · 3명 · 2026

---

## 핵심 약속

### 백엔드: 재고는 틀리지 않는다

1. **정확한 재고:** 결제하면 점주 화면 재고가 정확하게 줄어든다. 동시 주문 100건에도 음수가 되지 않는다.
2. **유통기한 안전:** 기한이 지난 lot은 구매 가능 수량과 예약에서 빠진다.

어떻게? **재고를 바꾸는 모든 일(입고·예약·확정·해제·폐기)을 SQS FIFO 큐 하나로 보내고, 점포를 메시지 그룹으로 삼아 점포별로 한 줄씩 처리**한다. DB 락 없이 순서가 보장된다.

### 인프라: 정해진 돈과 메모리 안에서 돌린다

3. **비용:** dev·prod 두 환경을 5주에 **약 205~240 USD(28~33만 원)**, 지원금 50만 원 안에서 운영한다. 그냥 켜 두면 약 800 USD라 지원금을 넘는다.
4. **메모리:** 노드는 **t3.large 2대**뿐이다. 앱·시스템·관측성 파드 40개가 메모리 할당 가능량의 **65%** 안에 들어간다.

#### 💰 비용: 안 쓰는 63%의 시간은 끈다

5주 840시간 중 실제로 쓰는 시간은 평일 09:00~21:00, **310시간(37%)** 뿐이다. 나머지 시간에 무엇을 끄느냐로 비용이 갈린다.

| 운영 방식 (dev 환경 1개, 5주) | 예상 비용 |
| --- | --- |
| 계속 켜 두기 | 약 400 USD |
| 밤에 노드 0대 · RDS 중지 | 약 265 USD |
| + 밤에 NAT Gateway 삭제 | 약 225 USD |
| **+ 주말엔 EKS 클러스터까지 삭제 (채택)** | **약 195 USD (−51%)** |

- **사람 대신 일정이 끈다.** API 한 번이면 되는 일(RDS·노드 그룹)은 EventBridge Scheduler, Terraform이 필요한 일(NAT·클러스터 생성/삭제)은 GitHub Actions. 매일 23:00에 남은 것을 한 번 더 끈다.
- **주말 삭제가 곧 재현성 검증이다.** Terraform을 유지 묶음(VPC·RDS·Cognito)과 클러스터 묶음(EKS·NAT)으로 나눠, 데이터는 남기고 클러스터만 매주 지웠다 다시 만든다.
- **prod는 필요한 날만 켠다.** 릴리스 확인·리허설·시연 날에만 클러스터를 올린다.
- **관리형 서비스로 노드를 아낀다.** 인증을 Keycloak 대신 Cognito로, 메시징을 Kafka 대신 SQS로 해서 클러스터 안에 띄울 것이 줄었다.

#### 🧠 메모리: 노드 2대에 다 들어가게 설계했다

이 프로젝트는 CPU보다 **JVM 메모리가 먼저 찬다.** 그래서 메모리를 기준으로 노드를 골랐다.

| 묶음 | 메모리 요청 |
| --- | --- |
| 앱 (Spring 서비스 5개, 파드 8개) | 약 4.1 GiB |
| 시스템 (ArgoCD, LB Controller, External Secrets 등) | 약 2.2 GiB |
| 관측성 (Prometheus, Grafana, Loki, Zipkin) | 약 2.9 GiB |
| **합계 / t3.large 2대 할당 가능량** | **9.2 / 14.2 GiB (65%)** |

- **t3.large를 고른 이유:** 같은 vCPU의 t3.medium보다 메모리가 2배, 노드당 파드 한도도 17 → 35개다.
- **OOMKilled 방지:** 파드마다 메모리 상한을 두고 JVM에 `-XX:MaxRAMPercentage=75`를 줘 상한 안에서만 힙을 쓴다.
- **배포 여유 확보:** 앱 CPU 요청을 250m → 150m로 낮춰 롤링 배포 때 새 파드가 뜰 자리(약 0.75 vCPU)를 남겼다.
- **밀려날 순서를 정했다:** 관측성 파드는 우선순위를 낮게 줘서, 자리가 모자라면 Grafana·Zipkin이 먼저 빠지고 앱은 남는다.

> 근거와 계산: [AWS 리소스 계획](https://github.com/sesac-freshlink/.github/blob/main/docs/aws-리소스-계획.md) 3장(노드 산정) · 6장(비용)

## 아키텍처

![FreshLink 아키텍처 구조도](https://raw.githubusercontent.com/sesac-freshlink/.github/main/docs/architecture/architecture.png)

번호별 흐름 설명: [docs/architecture](https://github.com/sesac-freshlink/.github/tree/main/docs/architecture)

## 레포지토리

| 레포 | 내용 | 담당 |
| --- | --- | --- |
| [gateway](https://github.com/sesac-freshlink/gateway) | Spring Cloud Gateway, 라우팅·JWT 검증 (Cognito JWKS) | 김진아 |
| [member-service](https://github.com/sesac-freshlink/member-service) | 회원 프로필·점포 (가입·로그인은 Amazon Cognito) | 김경우 |
| [inventory-service](https://github.com/sesac-freshlink/inventory-service) | 상품·재고(lot)·입고·예약·폐기 | 이태우 |
| [order-service](https://github.com/sesac-freshlink/order-service) | 주문·결제·Saga | 김경우 |
| [logistics-simulator](https://github.com/sesac-freshlink/logistics-simulator) | 가상 물류센터, 입고 쪽지 발행 | 김진아 |
| [frontend](https://github.com/sesac-freshlink/frontend) | React (점주 `/owner`, 고객 `/customer`) | 공통 |
| [common](https://github.com/sesac-freshlink/common) | Outbox 발행기, 멱등 처리, 메시지 DTO | 김진아 |
| [infra](https://github.com/sesac-freshlink/infra) | Terraform (persistent / cluster) | 김진아 |
| [gitops](https://github.com/sesac-freshlink/gitops) | Helm 차트, 서비스별 values, ArgoCD | 김진아 |

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프론트엔드 | React · S3 + CloudFront(OAC) · ACM |
| 백엔드 | Java 21 · Spring Boot 4.0 · Spring Data JPA · Spring Security(OAuth2 Resource Server) · Spring Cloud Gateway · Spring Cloud AWS |
| 인증 | Amazon Cognito User Pool (그룹 OWNER·CUSTOMER) · Amplify Auth · RS256 JWT를 JWKS로 검증 |
| 데이터 | Amazon RDS MySQL (인스턴스 1대, 서비스별 스키마 분리) |
| 메시징 | Amazon SQS (FIFO 1 + 표준 1 + DLQ 2) · Outbox · 멱등 처리 · Saga |
| 결제 | 토스페이먼츠 (테스트) |
| 플랫폼 | AWS EKS (t3.large × 2) · AWS Load Balancer Controller · IRSA |
| IaC | Terraform (유지 묶음 / 클러스터 묶음 분리) |
| CI / CD | GitHub Actions (OIDC) / ArgoCD (GitOps) |
| 관측성 | Prometheus (지표) · Grafana (화면) · Loki + Alloy (로그) · Zipkin (분산 추적) · Actuator·Micrometer |
| 환경 | AWS dev · prod (같은 Terraform 모듈) |

## 설계에서 고민한 것

- **SQS FIFO로 재고 동시성 해결** — Kafka 대신 관리형 SQS, 메시지 그룹 = 점포로 DB 락 없이 순서 보장
- **Outbox + 멱등 처리** — DB 저장과 메시지 발행을 함께 성공시키고, 중복 메시지는 한 번만 반영
- **CI는 GitHub Actions, CD는 ArgoCD** — CI가 클러스터에 손대지 않는 GitOps 구조라 Jenkins 서버를 운영할 이유가 없다

## 팀

| 이름 | 역할 |
| --- | --- |
| 김진아 | 팀장 · 인프라(Terraform, EKS, CI/CD) · gateway · logistics-simulator · common |
| 이태우 | inventory-service · 점주 재고 화면 |
| 김경우 | member-service · order-service · 로그인·주문 화면 |
| 문영훈 | 지원(10/14~10/16) · 서비스 4개 Spring 뼈대 · common v0.1.0·v0.1.1(쪽지 DTO 7종, 공통 오류 응답) · 오류 처리 · JSON 로그·Tracing |
