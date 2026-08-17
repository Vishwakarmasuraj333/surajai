import fs from 'fs';
import path from 'path';
import { storageProvider } from '../storage/storageProvider.js';

export interface GenerateFileOptions {
  filename: string;
  format: 'pdf' | 'xml' | 'json' | 'html' | 'csv' | 'txt';
  content: string;
  title?: string;
}

export interface GeneratedFileResult {
  filename: string;
  format: string;
  fileKey: string;
  downloadUrl: string;
  sizeBytes: number;
}

export class FileGeneratorService {
  /**
   * Helper to format raw content into valid XML if format is XML
   */
  private static formatXMLContent(content: string, title?: string): string {
    if (content.trim().startsWith('<?xml')) return content;
    const cleanTitle = (title || 'document').replace(/[^a-zA-Z0-9_]/g, '_');
    return `<?xml version="1.0" encoding="UTF-8"?>
<${cleanTitle}>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <content>
    <![CDATA[
${content}
    ]]>
  </content>
</${cleanTitle}>`;
  }

  /**
   * Helper to generate minimal valid PDF buffer without external binary dependencies
   */
  private static createSimplePDFBuffer(text: string, title?: string): Buffer {
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
    
    const lines = text.split('\n').slice(0, 35);
    let streamText = `BT /F1 12 Tf 50 740 Td 16 TL (${(title || 'Generated Document').replace(/[()]/g, '')}) Tj T* T* `;
    for (const line of lines) {
      const sanitized = line.replace(/[()]/g, '\\$&').replace(/[^\x20-\x7E]/g, ' ');
      streamText += `(${sanitized}) Tj T* `;
    }
    streamText += `ET`;

    const streamObj = `5 0 obj\n<< /Length ${Buffer.byteLength(streamText)} >>\nstream\n${streamText}\nendstream\nendobj\n`;
    const xref = `xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000230 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${header.length + streamObj.length}\n%%EOF`;

    return Buffer.from(header + streamObj + xref);
  }

  /**
   * Generate file and store it in storageProvider
   */
  static async generateFile(options: GenerateFileOptions): Promise<GeneratedFileResult> {
    const ext = options.format.toLowerCase();
    const cleanFilename = options.filename.endsWith(`.${ext}`)
      ? options.filename
      : `${options.filename}.${ext}`;

    let buffer: Buffer;

    switch (ext) {
      case 'xml': {
        const xmlText = this.formatXMLContent(options.content, options.title);
        buffer = Buffer.from(xmlText, 'utf-8');
        break;
      }
      case 'json': {
        try {
          const parsed = typeof options.content === 'object' ? options.content : JSON.parse(options.content);
          buffer = Buffer.from(JSON.stringify(parsed, null, 2), 'utf-8');
        } catch {
          buffer = Buffer.from(JSON.stringify({ title: options.title, content: options.content }, null, 2), 'utf-8');
        }
        break;
      }
      case 'html': {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.title || 'Generated Document'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; line-height: 1.6; }
    h1 { color: #8b5cf6; border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
    pre { bg: #1e293b; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${options.title || 'SurajAI Generated Document'}</h1>
  <div>${options.content.replace(/\n/g, '<br/>')}</div>
</body>
</html>`;
        buffer = Buffer.from(html, 'utf-8');
        break;
      }
      case 'csv': {
        buffer = Buffer.from(options.content, 'utf-8');
        break;
      }
      case 'pdf': {
        buffer = this.createSimplePDFBuffer(options.content, options.title);
        break;
      }
      case 'txt':
      default: {
        buffer = Buffer.from(options.content, 'utf-8');
        break;
      }
    }

    const key = await storageProvider.uploadFile(buffer, cleanFilename);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const downloadUrl = `${backendUrl}/api/files/download/${encodeURIComponent(key)}`;

    return {
      filename: cleanFilename,
      format: ext,
      fileKey: key,
      downloadUrl,
      sizeBytes: buffer.length,
    };
  }
}
