# 탱크맵 Backend

물탱크 작업 관리 앱의 REST API 서버입니다.

## 기술 스택

- **Runtime**: Node.js 20
- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Prisma 5
- **DB**: SQLite (로컬) → PostgreSQL (배포)
- **인증**: JWT (7일 만료)
- **파일 저장**: 로컬 `uploads/` 폴더 → S3 (배포)

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다. 필요시 수정하세요.

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### 3. DB 초기화 (최초 1회)

```bash
npm run db:migrate   # 테이블 생성
npm run db:seed      # 초기 데이터 삽입 (관리자 계정 + 체크리스트)
```

### 4. 개발 서버 실행

```bash
npm run dev
```

→ `http://localhost:4000` 에서 실행됩니다.

## 초기 계정

| 항목 | 값 |
|------|----|
| 이메일 | admin@tankmap.com |
| 비밀번호 | admin1234 |
| 권한 | 관리자 |

## 유용한 명령어

```bash
npm run dev          # 개발 서버 (파일 변경 시 자동 재시작)
npm run build        # TypeScript 빌드
npm run start        # 빌드된 파일 실행 (프로덕션)
npm run db:migrate   # DB 스키마 변경 적용
npm run db:studio    # Prisma Studio (DB GUI) 실행
npm run db:seed      # 초기 데이터 삽입
```

## 폴더 구조

```
backend/
├── prisma/
│   ├── schema.prisma       # DB 스키마 정의
│   ├── seed.ts             # 초기 데이터
│   └── migrations/         # 마이그레이션 히스토리
├── src/
│   ├── app.ts              # 서버 진입점
│   ├── lib/
│   │   └── prisma.ts       # Prisma 클라이언트 싱글톤
│   ├── middlewares/
│   │   └── auth.ts         # JWT 인증 / 권한 미들웨어
│   └── routes/
│       ├── auth.ts         # POST /api/auth/login, GET /api/auth/me
│       ├── users.ts        # 사용자 관리 (관리자 전용)
│       ├── companies.ts    # 회사 / 현장 관리
│       ├── works.ts        # 작업 CRUD
│       ├── photos.ts       # 사진 업로드 / 삭제
│       └── checklists.ts   # 체크리스트 관리
├── uploads/                # 업로드된 사진 파일 (로컬)
├── .env                    # 환경 변수
└── tsconfig.json
```

## API 목록

### 인증

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/auth/login` | 로그인 → JWT 반환 |
| GET | `/api/auth/me` | 내 정보 조회 |

### 사용자 (관리자 전용)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/users` | 사용자 목록 |
| POST | `/api/users` | 사용자 생성 |
| PATCH | `/api/users/:id` | 권한 / 상태 변경 |

### 회사 / 현장

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/companies` | 회사 목록 (검색 가능) |
| POST | `/api/companies` | 회사 등록 |
| GET | `/api/companies/:id/sites` | 현장 목록 |
| POST | `/api/companies/sites` | 현장 등록 |

### 작업

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/works` | 작업 목록 (날짜/상태/회사 필터) |
| POST | `/api/works` | 작업 등록 |
| GET | `/api/works/:id` | 작업 상세 |
| PATCH | `/api/works/:id` | 작업 수정 |
| PATCH | `/api/works/:id/status` | 상태 변경 |
| DELETE | `/api/works/:id` | 작업 삭제 (관리자) |

### 사진

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/works/:id/photos` | 사진 업로드 |
| DELETE | `/api/works/:id/photos/:photoId` | 사진 삭제 |

### 체크리스트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/checklist/items` | 체크리스트 항목 목록 |
| GET | `/api/works/:id/checklists` | 작업별 체크 현황 |
| PATCH | `/api/works/:id/checklists/:itemId` | 체크 토글 |

## PostgreSQL 전환 방법 (배포 시)

`prisma/schema.prisma` 에서 아래 부분만 수정하면 됩니다.

```prisma
datasource db {
  provider = "postgresql"   // "sqlite" → "postgresql"
  url      = env("DATABASE_URL")
}
```

`.env` 의 `DATABASE_URL` 도 PostgreSQL 연결 문자열로 교체 후 `npm run db:migrate` 실행.
