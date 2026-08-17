import { ProviderRegistry } from './providerRegistry.js';
import { PromptBuilder } from './prompts/promptBuilder.js';
import { logger } from '../../utils/logger.js';

async function runAIEngineTests() {
  logger.info('🧪 Starting AI Engine & Provider Registry Tests...');

  // 1. Model Registry Lookup Test
  logger.info('1. Testing Model Registry Lookup...');
  const availableModels = ProviderRegistry.getAvailableModels();
  if (!availableModels || availableModels.length === 0) {
    throw new Error('No models found in ProviderRegistry!');
  }
  logger.info(`Available Models Count: ${availableModels.length}`, availableModels.map(m => m.id));

  // 2. Resolve Gemini Provider
  logger.info('2. Testing Provider Resolution for gemini-1.5-pro...');
  const { provider, model } = ProviderRegistry.resolveProviderForModel('gemini-1.5-pro');
  if (provider.name !== 'gemini' || model.id !== 'gemini-1.5-pro') {
    throw new Error(`Failed to resolve gemini provider. Got ${provider.name}`);
  }
  logger.info('✅ Gemini Provider Resolution Test Passed!');

  // 3. System Prompt Builder Test
  logger.info('3. Testing PromptBuilder Structure...');
  const builtPrompt = PromptBuilder.buildPrompt([], 'Hello SurajAI');
  if (builtPrompt.length !== 2 || builtPrompt[0].role !== 'system' || builtPrompt[1].role !== 'user') {
    throw new Error('PromptBuilder output structure invalid!');
  }
  logger.info('✅ PromptBuilder Test Passed!');

  logger.info('🎉 ALL AI ENGINE UNIT TESTS PASSED SUCCESSFULLY!');
}

runAIEngineTests().catch((err) => {
  console.error('❌ AI Engine Test Failed:', err);
  process.exit(1);
});
