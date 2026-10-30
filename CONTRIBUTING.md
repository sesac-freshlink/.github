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
- **PR은 필수다.** 자기 레포라도 `main`·`dev`에 직접 push하지 않고, 작업 브랜치에서 PR을 열어 합친다. `dev` → `main`, `hotfix`도 PR로 한다. (예외: `gitops`의 이미지 태그 커밋은 CI가 자동으로 한다.)
- **합치기 전에 CI 빌드 체크만 통과하면 된다.** 아래 [PR 합치는 조건](#pr-합치는-조건)을 본다.
- **승인은 받지 않아도 된다.** CI가 초록이면 담당자가 직접 합친다.
- **합치는 방식:** 작업 브랜치 → `dev`는 **Squash merge**, `dev` → `main`은 **Merge commit**. `dev` → `main`을 Squash로 합치면 prod 승격이 멈춘다(infra README 4-13).
- **`dev` → `main` PR 제목:** `release: 2026-10-24 배포`
- 이슈를 닫으려면 본문에 `Closes sesac-freshlink/inventory-service#12`

### PR 합치는 조건

**결정 (2026-10-23): 필수 조건은 GitHub Actions 빌드 체크 하나다.**

| 조건 | 필수인가 | 언제 통과인가 |
| --- | --- | --- |
| **GitHub CI 빌드 체크** | ✅ 필수 | PR의 Actions 빌드 체크가 **모두 초록색**일 때. 빌드 워크플로가 없는 레포(`.github` 등)는 확인할 것이 없으므로 바로 합친다 |
| **AI 코드 리뷰 (CodeRabbit)** | 선택 | 연결해 둔 레포라면 지적을 참고한다. 남은 지적이 있어도 합칠 수 있다 |

- CI가 초록이면 승인 없이 담당자가 직접 합친다.
- CodeRabbit 연결은 각자 원하면 한다. 필수가 아니다.

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
| 서비스 릴리스 | `main`에 합치면 prod 승격 작업이 날짜 태그와 GitHub Release를 자동으로 만든다 | `v2026.10.xx` |

## 7. 비밀값

AWS 키, 토스 키는 **절대 커밋하지 않는다.** (JWT 서명 키는 없다. 로그인 토큰은 Amazon Cognito가 서명하고 gateway는 공개 키로 검증한다.) Organization Secret으로 한 번만 등록하고, AWS는 키 대신 GitHub OIDC로 IAM Role을 맡는다.

## 8. 누구에게 묻나 (2026-10-23)

| 무엇 | 누구에게 |
| --- | --- |
| **인프라** (AWS, `infra`·`gitops`, 클러스터, CI/CD·배포, 비밀값, 켜고 끄는 시간) | 김진아 |
| **백엔드 공통** (`common`, `gateway`, 공통 규칙·공통 설정) | 김진아 |
| 내 서비스 코드, 서비스 사이 API·쪽지 형식 | 해당 서비스 담당자끼리 정한다 |
| `frontend` (화면, **프론트 공통 로직** 포함) | 팀원끼리 정한다. 김진아에게 묻지 않아도 된다 |

**프론트엔드 공통 로직**(레이아웃, 라우팅, 역할 가드, `src/shared` 공통 컴포넌트·API 클라이언트 등)은 김진아가 처음 세팅만 했다. 그 뒤로는 팀원 누구나 자유롭게 고친다. 다른 사람 화면에 영향이 가는 변경이면 PR에 적고 팀 채널에 한 줄 알린다. `frontend`의 `CODEOWNERS`가 김진아를 리뷰어로 자동 지정해도 승인은 필요 없다.

## 9. Claude Code 에이전트 (선택, 2026-10-28)

- **에이전트·스킬·명령 md 파일을 레포에 넣어 쓰는 것은 필수가 아니다.** 쓰지 않아도 되고, 레포에 복사하는 PR을 올리지 않아도 된다.
- 쓰고 싶으면 `.github` 레포 `claude-agents/`의 원본을 그 레포 `.claude/`에 복사한다(방법은 [`docs/팀원-가이드/ai-agents.md`](docs/팀원-가이드/ai-agents.md) 2장). 플러그인(marketplace) 방식은 너무 느려서 쓰지 않는다.
- 에이전트를 고칠 때는 `.github`의 원본을 먼저 고치고 PR로 합친다. 레포 하나에만 필요한 규칙은 그 레포 `CLAUDE.md`에 쓴다.

## 10. 막히면

30분 넘게 혼자 막혀 있으면 팀 채널에 질문한다. 막힌 것을 공유하는 것도 진행 상황이다. 인프라·백엔드 공통 문제가 아니면 먼저 팀 채널에 올린다.
