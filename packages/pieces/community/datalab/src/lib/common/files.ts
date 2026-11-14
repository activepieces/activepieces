import { FilesService } from '@activepieces/pieces-framework';

async function saveBase64({ files, base64, fileName }: { files: FilesService; base64: string; fileName: string }): Promise<DatalabSavedFile> {
  const data = Buffer.from(base64, 'base64');
  return saveBuffer({ files, data, fileName });
}

async function saveText({ files, text, fileName }: { files: FilesService; text: string; fileName: string }): Promise<DatalabSavedFile> {
  return saveBuffer({ files, data: Buffer.from(text, 'utf8'), fileName });
}

async function saveBuffer({ files, data, fileName }: { files: FilesService; data: Buffer; fileName: string }): Promise<DatalabSavedFile> {
  const safeName = sanitizeFileName(fileName);
  const file = await files.write({ fileName: safeName, data });
  return { file, file_name: safeName, size: data.length };
}

function withExtension({ fileName, extension, fallback }: { fileName: unknown; extension: string; fallback: string }): string {
  const given = typeof fileName === 'string' ? fileName.trim() : '';
  const base = given.length > 0 ? given : fallback;
  const suffix = `.${extension.toLowerCase()}`;
  return base.toLowerCase().endsWith(suffix) ? base : `${base.replace(/\.[A-Za-z0-9]{1,5}$/, '')}${suffix}`;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[\\/]/g, '_')
    .replace(/[^\w.\- ]+/g, '_')
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 150) : 'file';
}

export const datalabFiles = { saveBase64, saveText, saveBuffer, withExtension, sanitizeFileName };

export type DatalabSavedFile = {
  file: string;
  file_name: string;
  size: number;
};
