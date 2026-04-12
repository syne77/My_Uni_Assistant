const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// 로컬 환경(.env.local)에서만 dotenv 로드, 프로덕션은 시스템 환경변수 사용
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

app.use(cors());
app.use(express.json());

// 프론트엔드용 설정 전달 API
app.get('/api/config', (req, res) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Warning: Supabase credentials missing in environment.');
  }
  res.json({
    supabaseUrl: SUPABASE_URL || '',
    supabaseAnonKey: SUPABASE_ANON_KEY || '',
  });
});

// frontend 폴더 연결
app.use(express.static(path.join(__dirname, '../frontend')));

// Gemini API 프록시 엔드포인트
app.post('/api/analyze', async (req, res) => {
  const { prompt } = req.body;
  console.log('req.body:', req.body);

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: '서버에 API 키가 설정되지 않았습니다. .env 파일을 확인하세요.',
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    console.log('Gemini response received');

    if (data.error) {
      console.error('Gemini Error:', data.error.message);
      return res.status(400).json({ error: data.error.message });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;

    // JSON 추출 로직 강화
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다.');
    }
    const result = JSON.parse(jsonMatch[0]);

    res.json(result);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
