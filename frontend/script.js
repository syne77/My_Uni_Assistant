// PDF.js worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Supabase 설정 (백엔드에서 가져와 초기화)
let _supabase = null;
let currentUser = null;

async function initSupabase() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();

    console.log('Backend Config received:', {
      hasUrl: !!config.supabaseUrl,
      hasKey: !!config.supabaseAnonKey,
    });

    if (config.supabaseUrl && config.supabaseAnonKey) {
      _supabase = supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey,
      );
      console.log('Supabase 초기화 완료');

      // 세션 변화 감지
      _supabase.auth.onAuthStateChange((event, session) => {
        handleAuthStateChange(event, session);
      });
    } else {
      console.error(
        'Supabase 설정 정보가 없습니다. 백엔드 서버의 .env.local 파일을 확인하세요.',
      );
    }
  } catch (err) {
    console.error('설정 정보를 가져오는데 실패했습니다:', err);
  }
}

// DOM 요소 선택
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const fileInfo = document.getElementById('file-info');
const fileNameDisplay = document.getElementById('file-name');
const extractBtn = document.getElementById('extract-btn');
const statusSection = document.getElementById('status-section');
const statusMessage = document.getElementById('status-message');
const resultSection = document.getElementById('result-section');
const summaryContent = document.getElementById('summary-text');
const quizList = document.getElementById('quiz-list');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const myPageToggle = document.getElementById('my-page-toggle');
const myPageSidebar = document.getElementById('my-page-sidebar');
const historyList = document.getElementById('history-list');
const completedQuizCount = document.querySelector(
  '.stat-item:first-child .count',
);
const studyReportCount = document.querySelector('.stat-item:last-child .count');
const newStudyBtn = document.getElementById('new-study-btn');
const languageSelect = document.getElementById('language-select');

// 인증 관련 요소 선택
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loggedOutView = document.getElementById('auth-logged-out');
const loggedInView = document.getElementById('auth-logged-in');
const userNameDisplay = document.getElementById('user-name');
const userEmailDisplay = document.getElementById('user-email');
const userAvatarDisplay = document.getElementById('user-avatar');

const HISTORY_KEY = 'ai_study_history';
const LANG_KEY = 'app_language';

const translations = {
  ko: {
    myPageBtn: '마이 페이지',
    heroText:
      '📚 수업 자료를 업로드하면 AI가 핵심 내용을 정리하고 퀴즈를 만들어줍니다!',
    uploadTitle: '📑 PDF 업로드',
    dropZoneText: 'PDF 파일을 여기로 드래그하거나 클릭하여 선택하세요.',
    extractBtn: '텍스트 추출 시작',
    statusAnalyzing: '내용을 분석하고 있습니다...',
    statusExtracting: 'PDF에서 텍스트를 추출하는 중입니다...',
    statusAIGenerating: 'AI가 내용을 요약하고 퀴즈를 생성하고 있습니다...',
    tabSummary: '📝 핵심 요약',
    tabQuiz: '❓ 학습 퀴즈',
    newStudyBtn: '✨ 새로운 학습 시작하기',
    myPageTitle: '마이 페이지',
    statQuizzes: '완료한 퀴즈',
    statReports: '학습 리포트',
    recentFilesTitle: '최근 학습한 파일',
    emptyHistory: '기록이 없습니다.',
    authMsg: '로그인하여 학습 데이터를 안전하게 보관하세요.',
    googleLogin: 'Google로 로그인',
    errorPdf: 'PDF 파일만 업로드할 수 있습니다.',
    errorExtract: 'PDF에서 텍스트를 추출하는 데 실패했습니다.',
    errorAI:
      'AI 분석에 실패했습니다. 백엔드 서버가 켜져 있는지 확인하거나 잠시 후 다시 시도해주세요.',
  },
  en: {
    myPageBtn: 'My page',
    heroText:
      '📚 Upload your study materials and AI will summarize and create quizzes for you!',
    uploadTitle: '📑 PDF Upload',
    dropZoneText: 'Drag and drop PDF here or click to select.',
    extractBtn: 'Start Extraction',
    statusAnalyzing: 'Analyzing content...',
    statusExtracting: 'Extracting text from PDF...',
    statusAIGenerating: 'AI is summarizing and creating quizzes...',
    tabSummary: '📝 Summary',
    tabQuiz: '❓ Learning Quiz',
    newStudyBtn: '✨ Start New Study',
    myPageTitle: 'My page',
    statQuizzes: 'Completed Quizzes',
    statReports: 'Study Reports',
    recentFilesTitle: 'Recent Files',
    emptyHistory: 'No history found.',
    authMsg: 'Log in to keep your study data safe.',
    googleLogin: 'Sign in with Google',
    errorPdf: 'Only PDF files are allowed.',
    errorExtract: 'Failed to extract text from PDF.',
    errorAI:
      'AI analysis failed. Please check the backend server or try again later.',
  },
  jp: {
    myPageBtn: 'マイページ',
    heroText:
      '📚 授業資料をアップロードすると、AIが要約とクイズを作成してくれます！',
    uploadTitle: '📑 PDFアップロード',
    dropZoneText:
      'PDFファイルをここにドラッグするか、クリックして選択してください。',
    extractBtn: 'テキスト抽出開始',
    statusAnalyzing: '内容を分析しています...',
    statusExtracting: 'PDFからテキストを抽出しています...',
    statusAIGenerating: 'AIが内容を要約し、クイズを作成しています...',
    tabSummary: '📝 要約',
    tabQuiz: '❓ 学習クイズ',
    newStudyBtn: '✨ 新しい学習を開始する',
    myPageTitle: 'マイページ',
    statQuizzes: '完了したクイズ',
    statReports: '学習レポート',
    recentFilesTitle: '最近学習したファイル',
    emptyHistory: '履歴がありません.',
    authMsg: 'ログインして学習データを安全に保管しましょう。',
    googleLogin: 'Googleでログイン',
    errorPdf: 'PDFファイルのみアップロード可能です。',
    errorExtract: 'PDFからのテキスト抽出に失敗しました。',
    errorAI:
      'AI分析に失敗しました。サーバーを確認するか、後でもう一度お試しください。',
  },
};

let currentLang = localStorage.getItem(LANG_KEY) || 'ko';

// 0. 초기 히스토리 및 언어 로드
document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();
  languageSelect.value = currentLang;
  updateUI();
  renderHistoryList();
  updateStats();
});

// 언어 선택 이벤트
languageSelect.addEventListener('change', (e) => {
  currentLang = e.target.value;
  localStorage.setItem(LANG_KEY, currentLang);
  updateUI();
});

function updateUI() {
  const t = translations[currentLang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });
}

// --- 인증 관련 로직 ---

// 인증 상태 변화 처리
function handleAuthStateChange(event, session) {
  if (session && session.user) {
    currentUser = session.user;
    updateAuthUI(true);
    console.log('Logged in as:', currentUser.email);
  } else {
    currentUser = null;
    updateAuthUI(false);
    console.log('Logged out');
  }

  // 로그인/로그아웃 시 히스토리 목록과 통계를 즉시 다시 불러옵니다.
  renderHistoryList();
  updateStats();
}

function updateAuthUI(isLoggedIn) {
  if (isLoggedIn) {
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');

    const profile = currentUser.user_metadata;
    userNameDisplay.textContent = profile.full_name || currentUser.email;
    userEmailDisplay.textContent = currentUser.email;
    if (profile.avatar_url) {
      userAvatarDisplay.src = profile.avatar_url;
    }
  } else {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');

    // 로그아웃 시 프로필 정보 초기화
    userNameDisplay.textContent = '사용자님';
    userEmailDisplay.textContent = 'user@example.com';
    userAvatarDisplay.src = 'images/avatar.jpg';
  }
}
// 구글 로그인 실행
async function signInWithGoogle() {
  if (!_supabase) {
    alert('Supabase가 아직 초기화되지 않았거나 설정에 문제가 있습니다.');
    return;
  }
  const { error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Error logging in:', error.message);
}

// 로그아웃 실행
async function signOut() {
  const { error } = await _supabase.auth.signOut();
  if (error) console.error('Error logging out:', error.message);
}

// 이벤트 리스너 등록
loginBtn.addEventListener('click', signInWithGoogle);
logoutBtn.addEventListener('click', signOut);

// --- 새로운 학습 시작 버튼 클릭 이벤트 ---
newStudyBtn.addEventListener('click', initNewStudy);

function initNewStudy() {
  // 데이터 변수 초기화
  selectedFile = null;
  extractedText = '';
  fileInput.value = ''; // 파일 input 초기화

  // UI 요소 초기화
  resultSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  dropZone.classList.remove('hidden');
  fileInfo.classList.add('hidden');
  extractBtn.disabled = false;

  // 첫 번째 탭(핵심 요약)으로 초기화
  tabButtons.forEach((b) => b.classList.remove('active'));
  tabContents.forEach((c) => c.classList.remove('active'));
  tabButtons[0].classList.add('active');
  tabContents[0].classList.add('active');

  // 페이지 상단으로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 마이페이지 토글 (모바일용 등)
myPageToggle.addEventListener('click', () => {
  myPageSidebar.scrollIntoView({ behavior: 'smooth' });
});

let selectedFile = null;
let extractedText = '';

// 1. 드래그 앤 드롭 및 파일 선택 이벤트
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

function handleFileSelect(file) {
  if (file.type !== 'application/pdf') {
    alert(translations[currentLang].errorPdf);
    return;
  }
  selectedFile = file;
  fileNameDisplay.textContent = file.name;
  fileInfo.classList.remove('hidden');
  dropZone.classList.add('hidden');
}

// 2. 텍스트 추출 기능 (PDF.js 활용)
extractBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  statusSection.classList.remove('hidden');
  extractBtn.disabled = true;
  statusMessage.textContent = translations[currentLang].statusExtracting;

  try {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    extractedText = fullText;
    console.log('Extracted Text:', extractedText.substring(0, 100) + '...');

    // 다음 단계: AI 연동
    processWithAI(extractedText);
  } catch (error) {
    console.error('PDF 추출 오류:', error);
    alert(translations[currentLang].errorExtract);
    statusSection.classList.add('hidden');
    extractBtn.disabled = false;
  }
});

// 3. AI 연동 (백엔드 서버 프록시 사용)
async function processWithAI(text) {
  statusMessage.textContent = translations[currentLang].statusAIGenerating;

  const targetLang = {
    ko: '한국어 (Korean)',
    en: '영어 (English)',
    jp: '일본어 (Japanese)',
  }[currentLang];

  try {
    const prompt = `
            다음은 PDF에서 추출된 수업 자료 내용입니다. 
            반드시 모든 내용을 **${targetLang}**로 작성해주세요.
            
            1. 내용을 핵심 위주로 깔끔하게 요약해주세요 (HTML 태그를 사용하여 구조화).
            2. 내용과 관련된 객관식 퀴즈 10개를 만들어주세요.
            
            응답은 반드시 아래와 같은 JSON 형식으로만 작성해주세요:
            {
              "summary": "요약된 내용 HTML 스트링",
              "quiz": [
                { "question": "문제1", "options": ["보기1", "보기2", "보기3"], "answer": 0 },
                ...
              ]
            }

            수업 자료 내용:
            ${text.substring(0, 10000)} 
        `;

    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('서버 분석 중 오류가 발생했습니다.');
    }

    const result = await response.json();

    // 히스토리에 저장
    saveToHistory(selectedFile.name, result);

    showResults(result);
  } catch (error) {
    console.error('AI 처리 오류:', error);
    alert(translations[currentLang].errorAI);
    statusSection.classList.add('hidden');
    extractBtn.disabled = false;
  }
}

// 4. 결과 출력 및 탭 전환
function showResults(data) {
  statusSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth' });

  summaryContent.innerHTML = data.summary;

  quizList.innerHTML = data.quiz
    .map(
      (q, idx) => `
        <div class="quiz-item" data-answer="${q.answer}">
            <p><strong>Q${idx + 1}. ${q.question}</strong></p>
            <div class="quiz-options">
                ${q.options
                  .map(
                    (opt, optIdx) => `
                    <label class="quiz-option">
                        <input type="radio" name="quiz-${idx}" value="${optIdx}">
                        <span>${opt}</span>
                    </label>
                `,
                  )
                  .join('')}
            </div>
            <p class="quiz-feedback hidden"></p>
        </div>
    `,
    )
    .join('');

  // 퀴즈 옵션 클릭 이벤트 추가
  const quizItems = document.querySelectorAll('.quiz-item');
  quizItems.forEach((item) => {
    const options = item.querySelectorAll('input[type="radio"]');
    const correctAnswer = parseInt(item.getAttribute('data-answer'));
    const feedback = item.querySelector('.quiz-feedback');

    options.forEach((option) => {
      option.addEventListener('change', () => {
        // 이미 선택된 경우 무시 (한 번만 선택 가능하게 하려면)
        // 모든 옵션 비활성화
        options.forEach((opt) => (opt.disabled = true));

        const selectedAnswer = parseInt(option.value);
        const parentLabel = option.parentElement;

        const isCorrect = selectedAnswer === correctAnswer;

        if (isCorrect) {
          parentLabel.classList.add('correct');
          feedback.textContent =
            currentLang === 'ko'
              ? '✅ 정답입니다!'
              : currentLang === 'en'
                ? '✅ Correct!'
                : '✅ 正解です！';
          feedback.style.color = '#155724';
        } else {
          parentLabel.classList.add('wrong');
          // 정답 표시
          options[correctAnswer].parentElement.classList.add('correct');
          const correctText =
            options[correctAnswer].nextElementSibling.textContent;
          feedback.textContent =
            currentLang === 'ko'
              ? `❌ 오답입니다. (정답: ${correctText})`
              : currentLang === 'en'
                ? `❌ Wrong. (Answer: ${correctText})`
                : `❌ 不正解です。(正解: ${correctText})`;
          feedback.style.color = '#721c24';
        }
        feedback.classList.remove('hidden');
        updateStats();
      });
    });
  });
}

// 5. 히스토리 관리 로직
async function saveToHistory(fileName, data) {
  // 1. 로그인된 유저라면 Supabase DB에 저장
  if (_supabase && currentUser) {
    const { error } = await _supabase.from('study_records').insert([
      {
        user_id: currentUser.id,
        file_name: fileName,
        summary: data.summary,
        quiz_data: data.quiz,
      },
    ]);

    if (error) {
      console.error('DB 저장 실패:', error.message);
    }
  } else {
    // 2. 로그인 안 된 유저라면 기존 로컬스토리지 방식 유지
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newItem = {
      id: Date.now(),
      fileName,
      date: new Date().toLocaleString(
        currentLang === 'ko'
          ? 'ko-KR'
          : currentLang === 'en'
            ? 'en-US'
            : 'ja-JP',
        {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      ),
      data,
    };

    history.unshift(newItem); // 최신순 정렬을 위해 앞에 추가
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10))); // 최근 10개만 저장
  }

  renderHistoryList();
  updateStats();
}

async function renderHistoryList() {
  let history = [];
  historyList.innerHTML = ''; // 기존 목록 초기화

  // 1. 로그인 상태: DB에서 데이터 가져오기
  if (_supabase && currentUser) {
    const { data, error } = await _supabase
      .from('study_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('DB 불러오기 실패:', error.message);
    } else {
      history = data.map((item) => ({
        id: item.id,
        fileName: item.file_name,
        date: new Date(item.created_at).toLocaleString(
          currentLang === 'ko'
            ? 'ko-KR'
            : currentLang === 'en'
              ? 'en-US'
              : 'ja-JP',
          {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        ),
        data: {
          summary: item.summary,
          quiz: item.quiz_data,
        },
      }));
    }
  } else {
    // 2. 비로그인 상태: 로컬스토리지에서 가져오기
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  }

  if (history.length === 0) {
    historyList.innerHTML = `<li class="empty-msg">${translations[currentLang].emptyHistory}</li>`;
    return;
  }

  historyList.innerHTML = history
    .map(
      (item) => `
    <li class="history-item" data-id="${item.id}">
      <div class="history-info">
        <span class="history-name">${item.fileName}</span>
        <span class="history-date">${item.date}</span>
      </div>
      <button class="btn-delete" title="Delete">&times;</button>
    </li>
  `,
    )
    .join('');

  // 클릭 이벤트 등록
  document.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        deleteHistory(el.dataset.id);
        return;
      }

      const id = el.dataset.id;
      const item = history.find((h) => String(h.id) === String(id));
      if (item) {
        // 업로드 섹션 숨기고 결과 표시
        uploadSection.classList.add('hidden');
        showResults(item.data);
      }
    });
  });
}

async function deleteHistory(id) {
  // 1. 로그인 상태: DB에서 삭제
  if (_supabase && currentUser) {
    const { error } = await _supabase
      .from('study_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DB 삭제 실패:', error.message);
      return;
    }
  } else {
    // 2. 비로그인 상태: 로컬스토리지에서 삭제
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history = history.filter((item) => String(item.id) !== String(id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  renderHistoryList();
  updateStats();
}

async function updateStats() {
  let count = 0;

  if (_supabase && currentUser) {
    const { count: dbCount, error } = await _supabase
      .from('study_records')
      .select('*', { count: 'exact', head: true });

    if (!error) count = dbCount;
  } else {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    count = history.length;
  }

  studyReportCount.textContent = count;
  completedQuizCount.textContent = count * 10;
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');

    tabButtons.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');
  });
});
