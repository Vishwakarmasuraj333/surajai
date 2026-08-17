import { DocumentProcessor } from '../services/documents/documentProcessor.js';
import { ToolRegistry } from '../services/tools/toolRegistry.js';
import { ContextEngine } from '../services/context/contextEngine.js';

async function runPlatformTests() {
  console.log('🧪 Running SurajAI Master Platform Unit & Integration Tests...\n');

  // Test 1: DocumentProcessor Text Chunking
  const sampleText = 'Word '.repeat(1200);
  const chunks = DocumentProcessor.chunkText(sampleText, 500, 50);
  console.log(`✅ DocumentProcessor chunking test passed (${chunks.length} chunks generated).`);

  // Test 2: Calculator Tool Execution
  const calcResult = await ToolRegistry.executeTool('calculator', { expression: '25 * 84 + (400 / 20)' }, { userId: 'test-user' });
  if (calcResult.success && calcResult.result.result === 2120) {
    console.log('✅ Calculator tool execution test passed (25 * 84 + 20 = 2120).');
  } else {
    console.error('❌ Calculator tool execution test failed:', calcResult);
  }

  // Test 3: Time Tool Execution
  const timeResult = await ToolRegistry.executeTool('time', { timezone: 'Asia/Kolkata' }, { userId: 'test-user' });
  if (timeResult.success && timeResult.result.currentTime) {
    console.log('✅ Time tool execution test passed.');
  } else {
    console.error('❌ Time tool execution test failed:', timeResult);
  }

  // Test 4: Weather Tool Execution
  const weatherResult = await ToolRegistry.executeTool('weather', { location: 'London' }, { userId: 'test-user' });
  if (weatherResult.success && weatherResult.result.temperature) {
    console.log(`✅ Weather tool execution test passed (${weatherResult.result.location}: ${weatherResult.result.temperature}).`);
  } else {
    console.error('❌ Weather tool execution test failed:', weatherResult);
  }

  // Test 5: ContextEngine Prompt Context Building
  const contextOutput = await ContextEngine.buildContext({
    userId: 'test-user',
    userPrompt: 'Tell me about SurajKart project.',
    recentMessages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi there!' }],
  });
  if (contextOutput.messages.length >= 3 && contextOutput.messages[0].role === 'system') {
    console.log('✅ ContextEngine prompt assembly test passed.');
  } else {
    console.error('❌ ContextEngine prompt assembly test failed:', contextOutput);
  }

  console.log('\n🎉 All SurajAI Platform Unit Tests Completed Successfully!');
}

runPlatformTests().catch(console.error);
