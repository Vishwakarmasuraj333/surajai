import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

async function testGeminiModels() {
  const genAI = new GoogleGenerativeAI(apiKey!);
  const candidates = [
    'gemini-[#2.5-flash]',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-pro-latest'
  ].map(s => s.replace('[#', '').replace(']', ''));

  for (const modelName of candidates) {
    try {
      console.log(`Testing candidate model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const streamRes = await model.generateContentStream('Hello SurajAI, test response.');
      let fullText = '';
      for await (const chunk of streamRes.stream) {
        fullText += chunk.text();
      }
      console.log(`\n🎉 SUCCESSFUL WORKING MODEL: "${modelName}"!\nResponse preview: "${fullText.slice(0, 100)}..."\n`);
      return modelName;
    } catch (err: any) {
      console.log(`❌ "${modelName}" failed: ${err.message.slice(0, 150)}`);
    }
  }
}

testGeminiModels().catch(console.error);
