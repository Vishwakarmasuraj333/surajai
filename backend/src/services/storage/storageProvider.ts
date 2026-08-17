import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string): Promise<string>;
  deleteFile(fileUrlOrPath: string): Promise<boolean>;
  getFilePath(fileUrlOrPath: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(targetPath, fileBuffer);
    return `/uploads/${safeName}`;
  }

  async deleteFile(fileUrlOrPath: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrlOrPath);
      const targetPath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete physical file:', err);
      return false;
    }
  }

  getFilePath(fileUrlOrPath: string): string {
    const fileName = path.basename(fileUrlOrPath);
    return path.join(this.uploadDir, fileName);
  }
}

export const storageProvider = new LocalStorageProvider();
