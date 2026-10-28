import { isRecord } from './client';
import { UploadFile } from './api';

function readUploadFile({ value, label }: { value: unknown; label: string }): UploadFile | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error(`${label} is not a valid file.`);
  }
  const data = value['data'];
  const filename = value['filename'];
  const base64 = value['base64'];
  const buffer = Buffer.isBuffer(data) ? data : typeof base64 === 'string' ? Buffer.from(base64, 'base64') : undefined;
  if (buffer === undefined || buffer.length === 0) {
    throw new Error(`${label} is empty.`);
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} is larger than PandaDoc's 50 MB upload limit.`);
  }
  const fileName = typeof filename === 'string' && filename.length > 0 ? filename : 'file';
  const extension = typeof value['extension'] === 'string' ? value['extension'] : fileName.split('.').pop() ?? '';
  return { data: buffer, fileName, contentType: CONTENT_TYPES[extension.toLowerCase()] ?? 'application/octet-stream' };
}

export const pandadocFiles = { readUploadFile };

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  rtf: 'application/rtf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  txt: 'text/plain',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};
