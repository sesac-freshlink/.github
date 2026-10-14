# FreshLink 기여 규칙

팀원 모두가 지키는 브랜치·커밋·PR 규칙이다. 처음이라면 이 문서만 읽고 시작해도 된다.

## 1. 브랜치

```
main (배포)  ←  dev (통합)  ←  feat/기능ID-설명
```

| 브랜치 | 용도 | 지워지나 |
| --- | --- | --- |
| `main` | EKS에 배포된 코드. 합치면 자동 배포 | 영구 |
| `dev` | 기능을 모아 통합 테스트하는 곳 (서비스·`frontend`·`common`의 기본 브랜치) | 영구 |
| `feat/<기능ID>-<설명>` | 기능 개발 | 합치면 자동 삭제 |
| `fix/<기능ID>-<설명>` | 버그 수정 | 합치면 자동 삭제 |
| `refactor/<설명>` | 동작은 그대로, 코드 정리 | 합치면 자동 삭제 |
| `chore/<설명>` | 빌드 설정, 의존성, CI | 합치면 자동 삭제 |
| `docs/<설명>` | 문서 | 합치면 자동 삭제 |
| `hotfix/<설명>` | `main`에서 따는 긴급 수정. 합친 뒤 `dev`에도 반영 (레포 담당자가 처리) | 합치면 자동 삭제 |

**레포별 예외**

| 레포 | 흐름 |
| --- | --- |
| `infra` | `main` ← `feat/I-xx-설명` (dev 없음). PR에 `terraform plan` 결과 첨부 |
| `gitops` | `main`만. 이미지 태그는 CI가 자동 커밋 |
| `.github` | `main` ← 작업 브랜치 |

**이름 쓰는 법**

- 기능 ID는 기획안 6장의 ID 그대로: `S-32`, `U-21`, `E-03`, `I-01`
- 설명은 영어 소문자 kebab-case, 2~4단어. 한글·대문자·언더스코어 금지

| 좋은 예 | 나쁜 예 |
| --- | --- |
| `feat/S-32-disposal` | `feat/폐기처리` |
| `feat/U-21-create-order` | `feat/u21_CreateOrder` |
| `fix/E-04-duplicate-message` | `fix/bug` |
| `chore/gradle-common-dependency` | `jina-work` |

## 2. 커밋 메시지

```
<종류>(<기능ID>): <한글 요약>
```

| 예 | 설명 |
| --- | --- |
| `feat(S-32): 폐기 API 추가` | 기능 |
| `fix(E-04): 같은 messageId 중복 반영 수정` | 버그 |
| `refactor: 재고 계산 로직 분리` | ID 없는 작업 |
| `chore: common 0.2.0으로 올림` | 설정·의존성 |
| `docs: dev 환경 실행 방법 추가` | 문서 |

종류: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

## 3. PR

- **제목:** 커밋 메시지와 같은 형식. Squash merge하면 PR 제목이 `dev`의 커밋 메시지가 된다.
- **본문:** 공통 PR 템플릿을 채운다.
- **PR·승인은 필수가 아니다.** MSA라 각자 자기 레포를 끝까지 책임지고, **담당자는 `main`·`dev`에 직접 push할 수 있다.** 리뷰를 받고 싶을 때나 남의 레포를 고칠 때 PR을 연다. 막혀 있는 것은 강제 push와 브랜치 삭제뿐이다.
- **합치는 방식:** 작업 브랜치 → `dev`는 **Squash merge**, `dev` → `main`은 **Merge commit**.
- **`dev` → `main` PR 제목:** `release: 2026-10-24 배포`
- 이슈를 닫으려면 본문에 `Closes sesac-freshlink/inventory-service#12`

## 4. 이슈

- 제목: `[S-32] 폐기 처리`. 기능 하나 = 이슈 하나.
- 모든 이슈는 Organization 프로젝트 보드 `FreshLink MVP`(Todo / In Progress / Review / Done)에 모은다.

## 5. 라벨

| 라벨 | 용도 |
| --- | --- |
| `feat`, `fix`, `refactor`, `chore`, `docs` | 작업 종류 |
| `priority:mvp` | 1순위 기능 |
| `blocked` | 다른 사람 작업을 기다리는 중 |
| `message-spec` | 쪽지 형식이 바뀌는 PR. 합치기 전에 상대 담당자(이태우·김경우)에게 꼭 알린다 |

## 6. 버전·태그

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| `common` | SemVer 태그 → GitHub Packages 배포 | `v0.1.0` |
| 서비스 이미지 | git 커밋 7자리. `latest` 금지 | `order-service:a1b2c3d` |
| 서비스 릴리스 (선택) | 시연 전 `main`에 날짜 태그 | `release-2026-11-07` |

## 7. 비밀값

AWS 키, 토스 키는 **절대 커밋하지 않는다.** (JWT 서명 키는 없다. 로그인 토큰은 Amazon Cognito가 서명하고 gateway는 공개 키로 검증한다.) Organization Secret으로 한 번만 등록하고, AWS는 키 대신 GitHub OIDC로 IAM Role을 맡는다.

## 8. 막히면

30분 넘게 혼자 막혀 있으면 팀 채널에 질문한다. 막힌 것을 공유하는 것도 진행 상황이다.
