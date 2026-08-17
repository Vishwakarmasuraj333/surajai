import http from 'http';
import { app } from '../app.js';
import { logger } from '../utils/logger.js';

async function runAuthIntegrationTest() {
  logger.info('🧪 Starting Auth System Integration & Error Handler Tests...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}`;

  try {
    const testEmail = `test_${Date.now()}@surajai.com`;
    const testPassword = 'StrongPassword123!';
    const testName = 'Test User';

    logger.info(`1. Testing Registration Request Handling...`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });

    const regData = await regRes.json();
    logger.info(`Registration Response Status: ${regRes.status}`, regData);

    if (regRes.status === 201 && regData.success) {
      logger.info('✅ Registration Test Passed (DB Connected)!');
    } else if (regRes.status === 503 && regData.error?.code === 'DATABASE_CONNECTION_ERROR') {
      logger.info('✅ Database Configuration Error Handled Gracefully (HTTP 503 DATABASE_CONNECTION_ERROR)!');
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(regData)}`);
    }

    logger.info('2. Testing Authentication Middleware Rejection for Missing Token...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`);
    const meData = await meRes.json();
    if (meRes.status === 401 && meData.success === false && meData.error.code === 'UNAUTHORIZED') {
      logger.info('✅ Auth Middleware Unauthorized Rejection Test Passed (HTTP 401)!');
    } else {
      throw new Error(`Expected 401 for unauthenticated request, got ${meRes.status}`);
    }

    logger.info('🎉 ALL AUTHENTICATION INTEGRATION & ERROR HANDLING TESTS PASSED!');
  } finally {
    server.close();
  }
}

runAuthIntegrationTest().catch((err) => {
  console.error('❌ Auth Integration Test Failed:', err);
  process.exit(1);
});
