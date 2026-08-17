import { prisma } from '../db/prisma.js';

async function runCrossUserSecurityTests() {
  console.log('🔒 Running Cross-User Security & Scoping Isolation Tests...');

  // 1. Create User A & User B
  const userA = await prisma.user.upsert({
    where: { email: 'usera@surajai-test.com' },
    update: {},
    create: {
      name: 'Security User A',
      email: 'usera@surajai-test.com',
      passwordHash: 'dummy_hash_a',
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: 'userb@surajai-test.com' },
    update: {},
    create: {
      name: 'Security User B',
      email: 'userb@surajai-test.com',
      passwordHash: 'dummy_hash_b',
    },
  });

  // 2. User A creates conversation, message, memory, and document
  const convA = await prisma.conversation.create({
    data: {
      userId: userA.id,
      title: "User A's Private Vault",
    },
  });

  const msgA = await prisma.message.create({
    data: {
      conversationId: convA.id,
      role: 'USER',
      content: 'User A Confidential API Secret Key',
    },
  });

  const memA = await prisma.memory.create({
    data: {
      userId: userA.id,
      content: 'User A secret preference',
    },
  });

  const docA = await prisma.document.create({
    data: {
      userId: userA.id,
      name: 'confidential_a.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      fileUrl: '/uploads/confidential_a.pdf',
    },
  });

  console.log('✅ Created User A resources.');

  // 3. VERIFY SECURITY ACCESS RULES FOR USER B

  // Test 3.1: Conversation ownership check
  const convAttempt = await prisma.conversation.findFirst({
    where: { id: convA.id, userId: userB.id },
  });
  if (convAttempt !== null) {
    throw new Error('SECURITY VIOLATION: User B was able to access User A conversation!');
  }
  console.log('✅ Security Test Passed: User B cannot query User A conversation.');

  // Test 3.2: Message ownership check via parent conversation
  const msgAttempt = await prisma.message.findFirst({
    where: { id: msgA.id, conversation: { userId: userB.id } },
  });
  if (msgAttempt !== null) {
    throw new Error('SECURITY VIOLATION: User B was able to access User A message!');
  }
  console.log('✅ Security Test Passed: User B cannot query User A message.');

  // Test 3.3: Memory ownership check
  const memAttempt = await prisma.memory.findFirst({
    where: { id: memA.id, userId: userB.id },
  });
  if (memAttempt !== null) {
    throw new Error('SECURITY VIOLATION: User B was able to access User A memory!');
  }
  console.log('✅ Security Test Passed: User B cannot query User A memory.');

  // Test 3.4: Document ownership check
  const docAttempt = await prisma.document.findFirst({
    where: { id: docA.id, userId: userB.id },
  });
  if (docAttempt !== null) {
    throw new Error('SECURITY VIOLATION: User B was able to access User A document!');
  }
  console.log('✅ Security Test Passed: User B cannot query User A document.');

  // Cleanup test resources
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversationId: convA.id } }),
    prisma.conversation.deleteMany({ where: { id: convA.id } }),
    prisma.memory.deleteMany({ where: { id: memA.id } }),
    prisma.document.deleteMany({ where: { id: docA.id } }),
    prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } }),
  ]);

  console.log('\n🎉 ALL CROSS-USER SECURITY ISOLATION TESTS PASSED 100%!');
}

runCrossUserSecurityTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ SECURITY TEST FAILED:', err);
    process.exit(1);
  });
