# 📚 AI 스터디 어시스턴트 개발 계획서

본 프로젝트는 학생들이 PDF 수업 자료를 업로드하면 AI가 핵심 내용을 요약하고 퀴즈를 생성하여 학습 효율을 높여주는 웹 서비스입니다.

## 🛠 1. 기술 스택

- **Frontend:** HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+)
- **Backend:** Node.js, Express (API Proxy Server)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google OAuth)
- **Deployment:** Render (Backend & Static Site)
- **PDF 처리:** [pdf.js](https://mozilla.github.io/pdf.js/)
- **AI API:** Google Gemini API

## 📝 2. 주요 기능

1.  **Google 로그인:** 사용자의 학습 데이터를 안전하게 보호하고 기기 간 동기화를 지원합니다.
2.  **클라우드 데이터 저장:** 요약 결과와 퀴즈 히스토리를 Supabase DB에 영구 저장합니다.
3.  **PDF 업로드 및 텍스트 추출:** PDF 내용을 읽어 AI 분석 데이터로 활용합니다.
4.  **다국어 지원:** 한국어, 영어, 일본어 UI 및 AI 응답 언어 선택이 가능합니다.
5.  **학습 대시보드:** 누적 학습 리포트 수와 완료한 퀴즈 통계를 제공합니다.

## 📅 3. 단계별 개발 로드맵

### 1단계 ~ 4단계: 핵심 기능 구현
- [x] 프로젝트 구조 설정 및 UI 디자인
- [x] 백엔드 서버 구축 및 AI 연동
- [x] PDF 텍스트 추출 기능 통합
- [x] 결과 렌더링 및 퀴즈 인터랙션 구현

### 5단계: 최적화 및 확장 기능
- [x] 최근 학습한 파일 히스토리(로컬 스토리지) 연동
- [x] 마이페이지 학습 통계(완료한 퀴즈 등) 실제 데이터 반영
- [x] **연속 학습 기능 추가:** 결과 화면에서 '새로운 학습 시작' 버튼 구현
- [x] **다국어 지원 (i18n):** 한국어, 영어, 일본어 UI 언어 선택 기능 추가
- [x] **AI 언어 연동:** 선택된 언어에 맞춰 요약 및 퀴즈 내용 생성 최적화

### 6단계: Supabase 연동 및 Google 로그인

#### 6-1. Supabase 프로젝트 및 인증 설정
- [x] **Google Cloud Console:** OAuth 클라이언트 ID 생성 및 승인된 리디렉션 URI 등록
- [x] **Supabase Auth:** Google 공급자 활성화 및 클라이언트 ID/비밀번호 입력
- [x] **클라이언트 SDK:** 프론트엔드에 `@supabase/supabase-js` 연동
- [x] **환경 변수 관리:** `.env.local` 연동 및 백엔드 프록시 설정 (버그 수정 완료)

#### 6-2. 데이터베이스 스키마 설계 및 UI 구현
- [x] **테이블 설계 및 SQL 작성:** `profiles`, `study_records` 테이블 및 RLS 정책 수립
- [x] **로그인 UI 구현:** Google 로그인/로그아웃 버튼 및 세션 상태 UI 반영

#### 6-3. 기능 마이그레이션 및 고도화
- [x] **저장 로직 전환:** `localStorage` 저장 로직을 Supabase `insert` API로 교체
- [x] **불러오기 로직 전환:** `renderHistoryList`에서 DB 데이터를 `select` 하도록 수정
- [x] **삭제 로직 전환:** DB 레코드 삭제 기능 구현
- [x] **통계 데이터 연동:** DB 카운트 기반으로 마이페이지 통계 실시간 반영
- [ ] **보안 강화 및 상태 동기화 (진행 중):**
    - [ ] 로그아웃 시 즉시 UI 히스토리 목록 초기화 및 `localStorage` 모드로 전환
    - [ ] 인증 상태 변경(`onAuthStateChange`) 시 모든 학습 데이터 로직 재실행 강제
    - [ ] 로그인 유저와 비로그인 유저의 데이터 세션 완전 분리

### 7단계: 서버 배포 및 운영 (Render)
- [ ] **Render 배포 설정:** `render.com`을 통한 Express 서버 배포
- [ ] **환경 변수 관리:** `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정
- [ ] **도메인 및 SSL 설정:** HTTPS 보안 접속 확인
- [ ] **최종 통합 테스트:** 실제 서버 환경에서의 AI 분석 및 DB 저장 속도 최적화
