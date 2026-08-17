import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

async function testGemini() {
  console.log('Testing Gemini API with Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log('Gemini Available Models Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

testGemini();
