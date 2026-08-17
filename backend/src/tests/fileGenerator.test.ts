import { FileGeneratorService } from '../services/file/fileGenerator.js';
import { storageProvider } from '../services/storage/storageProvider.js';
import fs from 'fs';

async function testFileGeneration() {
  console.log('📑 Running SurajAI Server-Side File Generator Tests...\n');

  // 1. Test PDF File Generation
  const pdfRes = await FileGeneratorService.generateFile({
    filename: 'test_report.pdf',
    format: 'pdf',
    title: 'SurajAI Q3 Financial Summary',
    content: 'Total Revenue: $4,500,000\nNet Margin: 86.4%\nARR Growth: +24%',
  });

  if (!pdfRes.fileKey || !pdfRes.downloadUrl) {
    throw new Error('PDF file generation failed');
  }

  const pdfPath = storageProvider.getFilePath(pdfRes.fileKey);
  if (!fs.existsSync(pdfPath)) {
    throw new Error('PDF physical file does not exist on disk');
  }
  console.log(`✅ PDF Generated Successfully: ${pdfRes.downloadUrl} (${pdfRes.sizeBytes} bytes)`);

  // 2. Test XML File Generation
  const xmlRes = await FileGeneratorService.generateFile({
    filename: 'invoice.xml',
    format: 'xml',
    title: 'InvoiceData',
    content: '<invoice id="1049"><amount>5000</amount><currency>USD</currency></invoice>',
  });

  const xmlPath = storageProvider.getFilePath(xmlRes.fileKey);
  if (!fs.existsSync(xmlPath)) {
    throw new Error('XML physical file does not exist on disk');
  }
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  if (!xmlContent.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML header in generated XML file');
  }
  console.log(`✅ XML Generated Successfully: ${xmlRes.downloadUrl}`);

  // Cleanup test files
  await storageProvider.deleteFile(pdfRes.fileKey);
  await storageProvider.deleteFile(xmlRes.fileKey);
  console.log('✅ Physical test files cleaned up successfully.\n');

  console.log('🎉 ALL SERVER-SIDE FILE GENERATOR TESTS PASSED 100%!');
}

testFileGeneration().catch((err) => {
  console.error('❌ File Generator Test Failed:', err);
  process.exit(1);
});
