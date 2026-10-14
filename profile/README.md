# FreshLink 🥬

**편의점 점주와 고객이 같은 재고를 실시간으로 보는 서비스**

고객이 핸드폰으로 근처 편의점 상품을 주문·결제하면, 그 순간 점주 화면의 재고가 줄어든다. 동시에 여러 명이 사도 재고는 음수가 되지 않고, 유통기한이 지난 상품은 고객에게 팔리지 않는다.

> SeSAC 팀 프로젝트 · 5주 MVP · 3명 · 2026

---

## 핵심 약속

1. **정확한 재고:** 결제하면 점주 화면 재고가 정확하게 줄어든다. 동시 주문 100건에도 음수가 되지 않는다.
2. **유통기한 안전:** 기한이 지난 lot은 구매 가능 수량과 예약에서 빠진다.

어떻게? **재고를 바꾸는 모든 일(입고·예약·확정·해제·폐기)을 SQS FIFO 큐 하나로 보내고, 점포를 메시지 그룹으로 삼아 점포별로 한 줄씩 처리**한다. DB 락 없이 순서가 보장된다.

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
| [local-dev](https://github.com/sesac-freshlink/local-dev) | Docker Compose (MySQL + LocalStack), 더미 데이터 | 김진아 |

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프론트엔드 | React · S3 + CloudFront(OAC) · ACM |
| 백엔드 | Java 21 · Spring Boot · Spring Data JPA · Spring Security(OAuth2 Resource Server) · Spring Cloud Gateway · Spring Cloud AWS |
| 인증 | Amazon Cognito User Pool (그룹 OWNER·CUSTOMER) · Amplify Auth · RS256 JWT를 JWKS로 검증 |
| 데이터 | Amazon RDS MySQL (인스턴스 1대, 서비스별 스키마 분리) |
| 메시징 | Amazon SQS (FIFO 1 + 표준 1 + DLQ 2) · Outbox · 멱등 처리 · Saga |
| 결제 | 토스페이먼츠 (테스트) |
| 플랫폼 | AWS EKS (t3.large × 2) · AWS Load Balancer Controller · IRSA |
| IaC | Terraform (유지 묶음 / 클러스터 묶음 분리) |
| CI / CD | GitHub Actions (OIDC) / ArgoCD (GitOps) |
| 관측성 | Prometheus (지표) · Grafana (화면) · Loki + Alloy (로그) · Zipkin (분산 추적) · Actuator·Micrometer |
| 로컬 | Docker Compose · LocalStack |

## 설계에서 고민한 것

- **SQS FIFO로 재고 동시성 해결** — Kafka 대신 관리형 SQS, 메시지 그룹 = 점포로 DB 락 없이 순서 보장
- **Outbox + 멱등 처리** — DB 저장과 메시지 발행을 함께 성공시키고, 중복 메시지는 한 번만 반영
- **주말엔 클러스터 삭제** — Terraform을 두 묶음으로 나눠 5주 비용을 약 400 → 195 USD로 줄이고, 매주 인프라 재현성을 검증
- **CI는 GitHub Actions, CD는 ArgoCD** — CI가 클러스터에 손대지 않는 GitOps 구조라 Jenkins 서버를 운영할 이유가 없다

## 팀

| 이름 | 역할 |
| --- | --- |
| 김진아 | 팀장 · 인프라(Terraform, EKS, CI/CD) · gateway · logistics-simulator · common |
| 이태우 | inventory-service · 점주 재고 화면 |
| 김경우 | member-service · order-service · 로그인·주문 화면 |
