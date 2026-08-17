import dotenv from 'dotenv';
dotenv.config();

import { GeminiProvider } from '../services/ai/providers/gemini.provider.js';

async function runLiveVerification() {
  console.log('==================================================');
  console.log('SURAJAI — NO PROMPT LEAK VERIFICATION TEST');
  console.log('==================================================');

  const provider = new GeminiProvider();

  // Test 1: Simple Greeting "hii"
  console.log('\n--- TEST 1: Simple Greeting "hii" ---');
  let test1Text = '';
  await provider.streamChat(
    [
      { role: 'system', content: 'You are SurajAI, a helpful assistant. Match language naturally.' },
      { role: 'user', content: 'hii' }
    ],
    (chunk) => {
      if (chunk.type === 'text_delta') {
        test1Text += chunk.content || '';
      }
    }
  );
  console.log('Response Output:');
  console.log(test1Text);

  // Check for leaks in Test 1
  const leakKeywords = ['User input:', 'Persona:', 'Behavior Rules', 'Option 1', 'Option 2', 'Option 3', '<USER_IDENTITY>', '<BEHAVIOR_RULES>'];
  const leaked1 = leakKeywords.filter((k) => test1Text.includes(k));
  if (leaked1.length > 0) {
    console.error('❌ LEAK DETECTED in Test 1:', leaked1);
    process.exit(1);
  } else {
    console.log('✅ TEST 1 PASSED: 0 System Prompt / Meta Leaks!');
  }

  // Test 2: Hinglish Question "html kya hai"
  console.log('\n--- TEST 2: Hinglish Question "html kya hai" ---');
  let test2Text = '';
  await provider.streamChat(
    [
      { role: 'system', content: 'You are SurajAI, a helpful assistant. Match language naturally.' },
      { role: 'user', content: 'html kya hai' }
    ],
    (chunk) => {
      if (chunk.type === 'text_delta') {
        test2Text += chunk.content || '';
      }
    }
  );
  console.log('Response Output:');
  console.log(test2Text);

  const leaked2 = leakKeywords.filter((k) => test2Text.includes(k));
  if (leaked2.length > 0) {
    console.error('❌ LEAK DETECTED in Test 2:', leaked2);
    process.exit(1);
  } else {
    console.log('✅ TEST 2 PASSED: 0 System Prompt / Meta Leaks!');
  }

  console.log('\n==================================================');
  console.log('🎉 ALL LIVE STREAM TESTS PASSED WITH 0 LEAKS!');
  console.log('==================================================');
}

runLiveVerification();
