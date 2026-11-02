# 팀원 가이드 7. dev Valkey(Redis) 접속 확인

작성: 김진아 · 2026-11-02 · 대상: 김경우(선착순 대기열), 이태우(재고 상한)

> **한 줄 요약:** dev Valkey는 클러스터 안에서만 닿는다. order 파드에는 `REDIS_HOST`·`REDIS_PORT`가 이미 들어가 있고, **TLS를 켜고** 붙으면 된다. 11/2 dev에서 TLS ping `PONG`과 order 파드 연결 오류 없음을 확인했다.

---

## 1. 무엇이 있나

| 항목 | 값 |
| --- | --- |
| 종류 | ElastiCache for Valkey 8.0 (Redis 호환), `cache.t4g.micro` 1대, 복제·백업 없음 |
| dev 주소 | `master.freshlink-dev-cache.7qnese.apn2.cache.amazonaws.com` (클러스터를 다시 만들면 바뀔 수 있다. 아래 2장처럼 환경 변수로만 쓴다) |
| 포트 | `6379` |
| TLS | **켜져 있다.** 평문 접속은 받지 않는다 |
| 비밀번호 | 없다. 보안 그룹으로 EKS 클러스터에서 오는 접속만 받는다 |
| 켜져 있는 시간 | dev 클러스터와 같다. 월 08:40 생성 → 금 21:05 삭제. **지울 때 데이터도 같이 사라진다** (대기열·입장 토큰처럼 잠깐 쓰는 값만 둔다) |
| prod | prod 클러스터를 만들 때 같이 생긴다. gitops prod values도 이미 들어가 있다 |

값이 order 파드까지 가는 길: Secrets Manager `freshlink-dev/order/redis`(JSON `host`·`port`) → ExternalSecret `order-service-redis` → 파드 환경 변수 `REDIS_HOST`·`REDIS_PORT` (gitops [#13](https://github.com/sesac-freshlink/gitops/pull/13)).

지금 주소를 받는 서비스는 **order-service 하나**다. inventory 등 다른 서비스도 써야 하면 김진아에게 말해 주세요(gitops values에 같은 비밀을 더한다).

## 2. 서비스 설정 (order)

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT:6379}
      ssl:
        enabled: true      # 빠뜨리면 접속이 멈춰 있다가 시간 초과로 끊긴다
```

의존성은 `org.springframework.boot:spring-boot-starter-data-redis` 하나면 된다(Lettuce 포함).

## 3. 붙었는지 확인하는 법

### 3-1. 여러분이 볼 수 있는 것

1. **dev 배포 뒤 order가 잘 뜨는지**: [가이드 6](6-디스코드-알림.md)의 배포 알림이 ✅이고, dev 화면에서 대기열 API를 불렀을 때 500이 아니면 붙은 것이다. 500이면 응답의 `traceId`를 김진아에게 주면 Grafana 로그([가이드 4](4-관측성.md))에서 `{namespace="freshlink", app="order-service"} |= "Redis"`로 찾아 본다.
2. **주소 값 보기** (PowerShell, 읽기 권한이 없다는 오류가 나면 김진아에게):

```powershell
$env:AWS_PROFILE = "freshlink-dev"
aws secretsmanager get-secret-value --secret-id freshlink-dev/order/redis --region ap-northeast-2 --query SecretString --output text
#   {"host":"master.freshlink-dev-cache....amazonaws.com","port":"6379"} 처럼 나오면 비밀이 있다
```

### 3-2. 김진아가 하는 확인 (클러스터 권한 필요)

`kubectl` 권한은 김진아에게만 있다([가이드 2](2-인프라-배포.md)). 의심되면 디스코드로 "Valkey ping 봐 주세요"라고 남겨 주세요. 김진아는 이렇게 본다.

```powershell
$env:AWS_PROFILE = "freshlink-admin"
aws eks update-kubeconfig --name freshlink-dev-eks --region ap-northeast-2
$h = terraform "-chdir=envs/dev/cluster" output -raw cache_endpoint   # C:\fresh-link\repos\infra 에서
kubectl run valkey-check -n freshlink --rm -it --restart=Never --image=valkey/valkey:8.0-alpine -- valkey-cli -h $h -p 6379 --tls ping
#   PONG 이면 성공. 이미지는 8.0-alpine을 쓴다(기본 valkey/valkey:8 에는 CA 인증서 묶음이 없어 TLS 검증에서 실패한다. Java 앱은 상관없다)
kubectl get externalsecret -n freshlink order-service-redis              # STATUS SecretSynced
kubectl exec -n freshlink deploy/order-service -- printenv REDIS_HOST REDIS_PORT
```

11/2 결과: `PONG`, `SecretSynced`, order 파드 1/1 Running 재시작 0, 로그에 Redis 오류 없음.

## 4. 내 PC(IntelliJ)에서 order를 띄울 때

dev Valkey는 **PC에서 닿지 않는다.** DB처럼 접속용 서버로 포트 포워딩을 해도 Valkey 보안 그룹이 EKS 클러스터에서 오는 접속만 받는다. 대기열 코드는 단위 테스트(Testcontainers `valkey/valkey:8.0` 또는 `redis:7`)로 확인하고, Valkey와 붙여 보는 것은 dev에 배포해서 본다. PC에서 꼭 붙어야 하면 김진아에게 말해 주세요(접속용 서버에서도 6379를 열 수 있다).

## 5. 문제가 생기면

| 증상 | 원인과 해결 |
| --- | --- |
| 접속이 멈춰 있다가 시간 초과 | `ssl.enabled: true`를 빠뜨렸다 |
| order 파드가 `CreateContainerConfigError` | 비밀 `freshlink-dev/order/redis`가 아직 없다(클러스터 생성 중이거나 실패). 김진아에게 |
| 월요일 아침 대기열 데이터가 없다 | 정상이다. 금요일 밤 클러스터와 같이 지워진다 |
| `READONLY` 오류 | 1대짜리라 나오지 않아야 한다. 나오면 김진아에게 |

관련: infra README 4-19(만드는 쪽), [2차 사람별 할 일](../할일/2차-사람별-할-일.md) Redis 항목.
