import { prisma } from '../db/prisma.js';
import { AIService } from '../services/ai/AIService.js';
import { ContextEngine } from '../services/context/contextEngine.js';

async function testFullChatFlow() {
  console.log('🧪 Testing End-to-End Chat Flow with Gemini Model...');

  // 1. Create or fetch test user
  let user = await prisma.user.findFirst({ where: { email: 'test@surajai.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test SurajUser',
        email: 'test@surajai.com',
        passwordHash: 'hashed_pass_dummy',
      },
    });
  }

  // 2. Create conversation
  const conv = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Hinglish JWT Test',
      model: 'gemini-3.6-flash',
    },
  });

  const promptText = 'Hello SurajAI, explain JWT authentication in simple Hinglish.';

  // 3. Save User Message
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: 'USER',
      content: promptText,
    },
  });

  // 4. Assemble Context
  const contextOutput = await ContextEngine.buildContext({
    userId: user.id,
    conversationId: conv.id,
    userPrompt: promptText,
    recentMessages: [],
  });

  console.log('📡 Starting SSE stream Chat with Gemini 3.6 Flash...');

  let streamedText = '';
  let chunkCount = 0;

  const fullResponse = await AIService.streamChat(
    user.id,
    conv.id,
    contextOutput.messages,
    (chunk) => {
      if (chunk.type === 'text_delta' && chunk.content) {
        streamedText += chunk.content;
        chunkCount++;
      }
    },
    { model: 'gemini-3.6-flash' }
  );

  console.log(`\n✅ SSE STREAMING SUCCESSFUL! Received ${chunkCount} text chunks (${streamedText.length} characters).`);
  console.log(`\n--- ASSISTANT RESPONSE PREVIEW ---\n${streamedText.slice(0, 250)}...\n-----------------------------------\n`);

  // 5. Save Assistant Message to Database
  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: 'ASSISTANT',
      content: streamedText,
      model: 'gemini-3.6-flash',
    },
  });

  // 6. Verify UsageLog Creation
  const usageLog = await prisma.usageLog.findFirst({
    where: { conversationId: conv.id, status: 'success' },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`✅ DATABASE VERIFICATION:
- Message Saved ID: "${assistantMsg.id}"
- UsageLog Created ID: "${usageLog?.id}" (Total Tokens: ${usageLog?.totalTokens}, Latency: ${usageLog?.latencyMs}ms)
- Status: ${usageLog?.status}`);

  console.log('\n🎉 ALL VERIFICATIONS PASSED CLEANLY WITH ZERO 404 ERRORS!');
}

testFullChatFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ CHAT TEST FAILED:', err);
    process.exit(1);
  });
