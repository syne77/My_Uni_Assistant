const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    console.log('Gemini response:', data);

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;

    // JSON 추출 로직 (프론트에서 하던 것과 동일)
    const jsonString = aiResponseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonString);

    res.json(result);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
