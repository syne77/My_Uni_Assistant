// PDF.js worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// DOM 요소 선택
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
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
    alert('PDF 파일만 업로드할 수 있습니다.');
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
  statusMessage.textContent = 'PDF에서 텍스트를 추출하는 중입니다...';

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
    alert('PDF에서 텍스트를 추출하는 데 실패했습니다.');
    statusSection.classList.add('hidden');
    extractBtn.disabled = false;
  }
});

// 3. AI 연동 (백엔드 서버 프록시 사용)
async function processWithAI(text) {
  statusMessage.textContent = 'AI가 내용을 요약하고 퀴즈를 생성하고 있습니다...';

  try {
    const prompt = `
            다음은 PDF에서 추출된 수업 자료 내용입니다. 
            1. 내용을 핵심 위주로 깔끔하게 요약해주세요 (HTML 태그를 사용하여 구조화).
            2. 내용과 관련된 객관식 퀴즈 3개를 만들어주세요.
            
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
    showResults(result);
  } catch (error) {
    console.error('AI 처리 오류:', error);
    alert('AI 분석에 실패했습니다. 백엔드 서버가 켜져 있는지 확인하거나 잠시 후 다시 시도해주세요.');
    statusSection.classList.add('hidden');
    extractBtn.disabled = false;
  }
}

// 4. 결과 출력 및 탭 전환
function showResults(data) {
  statusSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  summaryContent.innerHTML = data.summary;

  quizList.innerHTML = data.quiz
    .map(
      (q, idx) => `
        <div class="quiz-item">
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
        </div>
    `,
    )
    .join('');
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
