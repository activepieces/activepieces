function mimeTypeFor({ fileName, extension }: { fileName: string; extension?: string }): string {
  const fromName = fileName.includes('.') ? fileName.split('.').pop() : undefined;
  const ext = (extension ?? fromName ?? '').replace(/^\./, '').toLowerCase();
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

function sanitizeFileName({ value }: { value: string }): string {
  const cleaned = value.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (cleaned.length === 0) throw new Error('File Name is empty after removing characters Xero does not allow.');
  return cleaned;
}

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  webp: 'image/webp',
  csv: 'text/csv',
  txt: 'text/plain',
  rtf: 'application/rtf',
  xml: 'application/xml',
  json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  zip: 'application/zip',
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',
};

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const xeroAttachments = {
  mimeTypeFor,
  sanitizeFileName,
};
