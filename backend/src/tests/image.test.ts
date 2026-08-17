import { defaultImageProvider } from '../services/image/imageGenerationProvider.js';
import { storageProvider } from '../services/storage/storageProvider.js';
import { prisma } from '../db/prisma.js';
import fs from 'fs';

async function runImageTests() {
  console.log('🎨 Running SurajAI Real Image Generation & Storage Integration Tests...\n');

  // 1. Test PollinationsImageProvider
  const options = {
    prompt: 'A futuristic cybernetic tiger in neon jungle',
    aspectRatio: '1:1',
    model: 'flux',
  };

  console.log('⏳ Generating real test image via Pollinations AI...');
  const result = await defaultImageProvider.generate(options);

  if (!result.storageKey || !result.fileUrl) {
    throw new Error('Image generation test failed: invalid result object');
  }

  console.log('✅ Real image generated successfully!');
  console.log(`   - Storage Key: ${result.storageKey}`);
  console.log(`   - Dimensions: ${result.width}x${result.height}`);
  console.log(`   - Provider/Model: ${result.provider} / ${result.model}`);

  // 2. Test File Existence on Disk
  const filePath = storageProvider.getFilePath(result.storageKey);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file test failed: file not found on disk at ${filePath}`);
  }
  console.log('✅ Physical file verified on local disk uploads directory.');

  // 3. Cleanup Test File
  await storageProvider.deleteFile(result.storageKey);
  if (fs.existsSync(filePath)) {
    throw new Error('Storage Provider delete file test failed: file still exists on disk');
  }
  console.log('✅ Storage Provider file unlinking verified.\n');

  console.log('🎉 ALL REAL IMAGE GENERATION INTEGRATION TESTS PASSED 100%!');
}

runImageTests().catch((err) => {
  console.error('❌ Image Test Failed:', err);
  process.exit(1);
});
