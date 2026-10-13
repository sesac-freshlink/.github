# .github

FreshLink Organization 공통 설정 레포. 여기 있는 파일은 **Organization의 모든 레포에 기본값으로 적용**된다(각 레포에 같은 파일이 없을 때).

| 파일 | 역할 |
| --- | --- |
| [`profile/README.md`](profile/README.md) | https://github.com/sesac-freshlink 첫 화면에 보이는 소개 |
| [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) | 모든 레포 공통 PR 본문 양식 |
| [`ISSUE_TEMPLATE/`](ISSUE_TEMPLATE) | 기능·버그 이슈 양식 |
| [`docs/기획안-및-설계도.md`](docs/기획안-및-설계도.md) | MVP 기획안(기능·흐름·담당·데이터 모델·메시지 명세)과 인프라 산정(AWS 리소스·노드·비용·Terraform 모듈) |
| [`docs/git-계획.md`](docs/git-계획.md) | Organization·레포 구성, 브랜치·태그·CI/CD·시크릿 규칙 |
| [`docs/architecture/`](docs/architecture) | 아키텍처 구조도(PNG·SVG)와 번호별 흐름 설명, 구조도 계획([`구조도-계획.md`](docs/architecture/구조도-계획.md))과 생성 스크립트 |
| [`docs/프로젝트-보드-사용법.md`](docs/프로젝트-보드-사용법.md) | 프로젝트 보드·이슈·브랜치·커밋 연동 사용법 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 브랜치·커밋·PR·라벨 규칙 |

앞으로 추가할 것: 재사용 워크플로 `workflows/spring-build.yml`, `workflows/frontend-deploy.yml` (각 서비스 레포가 몇 줄로 불러 쓴다).

- 담당: 김진아
- 브랜치: `main` ← 작업 브랜치 (배포 없음)
