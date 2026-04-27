# 탱크맵 Frontend

물탱크 작업 관리 앱의 PWA 웹 클라이언트입니다.

## 기술 스택

- **Framework**: React 19 + Vite 6
- **Language**: TypeScript
- **스타일**: Tailwind CSS v4
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand
- **폼**: React Hook Form + Zod
- **달력**: react-big-calendar
- **PWA**: vite-plugin-pwa

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

→ `http://localhost:5173` 에서 실행됩니다.

> **백엔드 서버가 먼저 실행 중이어야 합니다** (`http://localhost:4000`)

## 주의사항

- **Node.js 20.19 미만** 사용 시 Vite 8이 동작하지 않아 **Vite 6** 을 사용합니다.
- 백엔드 API 프록시가 `vite.config.ts` 에 설정되어 있어 CORS 없이 연동됩니다.

## 유용한 명령어

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 검사
```

## 폴더 구조

```
frontend/src/
├── api/
│   ├── client.ts       # axios 인스턴스 (JWT 인터셉터 포함)
│   ├── auth.ts         # 로그인 / 내 정보 API
│   └── works.ts        # 작업 / 회사 / 사진 / 체크리스트 API
├── components/
│   ├── layout/
│   │   └── Layout.tsx  # 헤더 + 하단 네비게이션
│   └── ui/             # 공용 UI 컴포넌트
├── lib/
│   └── utils.ts        # 상태 라벨/색상, 날짜 포맷 유틸
├── pages/
│   ├── LoginPage.tsx       # 로그인
│   ├── CalendarPage.tsx    # 달력 메인
│   ├── WorkListPage.tsx    # 작업 목록 + 검색/필터
│   ├── WorkFormPage.tsx    # 작업 등록 / 수정
│   ├── WorkDetailPage.tsx  # 작업 상세 + 사진 + 체크리스트
│   └── AdminPage.tsx       # 사용자 관리 (관리자 전용)
├── store/
│   └── authStore.ts    # 로그인 상태 (Zustand + localStorage)
├── types/
│   └── index.ts        # TypeScript 타입 정의
├── App.tsx             # 라우터 설정
└── main.tsx            # 진입점
```

## 화면 구성

| 경로 | 화면 | 접근 권한 |
|------|------|-----------|
| `/login` | 로그인 | 비인증 |
| `/` | 달력 메인 | 로그인 필요 |
| `/works` | 작업 목록 | 로그인 필요 |
| `/works/new` | 작업 등록 | 로그인 필요 |
| `/works/:id` | 작업 상세 | 로그인 필요 |
| `/works/:id/edit` | 작업 수정 | 로그인 필요 |
| `/admin` | 사용자 관리 | 관리자 전용 |

## 작업 상태 색상

| 상태 | 색상 |
|------|------|
| 예정 | 파란색 |
| 진행중 | 노란색 |
| 완료 | 초록색 |
| 보류 | 회색 |

## 사진 카테고리

작업별 사진은 4가지 카테고리로 분류됩니다.

- `before` — 작업 전
- `during` — 작업 중
- `after` — 작업 후
- `oxygen` — 산소농도 측정

## 환경 변수

별도 `.env` 파일 없이 동작합니다. 백엔드 URL은 `vite.config.ts` 의 프록시 설정으로 관리합니다.

배포 시 환경에 맞게 `vite.config.ts` 의 프록시 또는 `VITE_API_URL` 환경 변수로 전환하세요.
