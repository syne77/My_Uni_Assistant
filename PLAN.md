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
- [x] **Supabase 프로젝트 및 인증 설정:** Google OAuth 연동 및 SDK 초기화
- [x] **데이터베이스 스키마 설계:** `profiles`, `study_records` 테이블 및 RLS 정책 수립
- [x] **기능 마이그레이션:** 로컬스토리지에서 Supabase DB로의 저장/불러오기 전환 완료
- [x] **보안 및 UI 버그 수정:** 로그아웃 시 데이터 초기화 및 다국어 텍스트 적용

### 7단계: 서버 배포 및 운영 (Render)
- [x] **배포 코드 최적화:** `package.json` 엔진 명시 및 `server.js` 환경변수 처리 개선
- [ ] **Render 서버 실행:** `render.com` 서비스 생성 및 환경변수 주입
- [ ] **도메인 확인:** 배포된 URL 접속 테스트 및 HTTPS 적용 확인
- [ ] **구글 OAuth 리디렉션 업데이트:** 배포된 도메인을 구글 콘솔 및 Supabase 설정에 추가
