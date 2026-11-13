import { randomBytes } from 'crypto';
import { Property } from '@activepieces/pieces-framework';
import { isRecord } from './client';
import { retellInput } from './input';

export const knowledgeBaseSourceProps = {
  texts: Property.Array({
    displayName: 'Texts',
    description: 'Optional text snippets to add, each with a title.',
    required: false,
    properties: {
      title: Property.ShortText({ displayName: 'Title', required: true }),
      text: Property.LongText({ displayName: 'Text', required: true }),
    },
  }),
  urls: Property.Array({
    displayName: 'URLs',
    description: 'Optional web pages Retell scrapes and adds.',
    required: false,
  }),
  file: Property.File({
    displayName: 'File',
    description: 'Optional document to add (PDF, DOCX, TXT, MD, CSV and similar, up to 50 MB).',
    required: false,
  }),
};

export function buildKnowledgeBaseForm({
  name,
  texts,
  urls,
  file,
  requireSource,
}: {
  name?: string;
  texts: unknown;
  urls: unknown;
  file: unknown;
  requireSource: boolean;
}): MultipartBody {
  const parts: MultipartPart[] = [];
  if (name !== undefined) {
    parts.push({ name: 'knowledge_base_name', value: name });
  }
  const textEntries = (Array.isArray(texts) ? texts : []).map((entry, index) => {
    const record = isRecord(entry) ? entry : {};
    return {
      title: retellInput.requiredText({ value: record['title'], label: `Text ${index + 1} Title` }),
      text: retellInput.requiredText({ value: record['text'], label: `Text ${index + 1} Text` }),
    };
  });
  const urlEntries = retellInput.stringList({ value: urls, label: 'URLs', max: MAX_URLS });
  for (const url of urlEntries) {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`URL "${url}" must start with http:// or https://.`);
    }
  }
  const upload = readFile(file);
  if (requireSource && textEntries.length === 0 && urlEntries.length === 0 && upload === undefined) {
    throw new Error('Add at least one text, URL or file.');
  }
  if (textEntries.length > 0) {
    parts.push({ name: 'knowledge_base_texts', value: JSON.stringify(textEntries) });
  }
  if (urlEntries.length > 0) {
    parts.push({ name: 'knowledge_base_urls', value: JSON.stringify(urlEntries) });
  }
  if (upload !== undefined) {
    parts.push({ name: 'knowledge_base_files', value: upload.data, filename: upload.filename });
  }
  return encodeMultipart(parts);
}

function encodeMultipart(parts: MultipartPart[]): MultipartBody {
  const boundary = `----RetellAiBoundary${randomBytes(12).toString('hex')}`;
  const chunks = parts.flatMap((part) => {
    const disposition =
      part.filename === undefined
        ? `form-data; name="${part.name}"`
        : `form-data; name="${part.name}"; filename="${part.filename.replace(/["\r\n\\]/g, '_')}"`;
    const headers = [`--${boundary}`, `Content-Disposition: ${disposition}`];
    if (part.filename !== undefined) {
      headers.push('Content-Type: application/octet-stream');
    }
    return [
      Buffer.from(`${headers.join('\r\n')}\r\n\r\n`, 'utf8'),
      typeof part.value === 'string' ? Buffer.from(part.value, 'utf8') : part.value,
      Buffer.from('\r\n', 'utf8'),
    ];
  });
  return {
    body: Buffer.concat([...chunks, Buffer.from(`--${boundary}--\r\n`, 'utf8')]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function readFile(file: unknown): { data: Buffer; filename: string } | undefined {
  if (file === undefined || file === null || file === '') {
    return undefined;
  }
  if (!isRecord(file) && typeof file !== 'object') {
    throw new Error('File must be a file from an earlier step.');
  }
  const data: unknown = Reflect.get(file, 'data');
  const filename: unknown = Reflect.get(file, 'filename');
  if (!Buffer.isBuffer(data) || typeof filename !== 'string' || filename.length === 0) {
    throw new Error('File must be a file from an earlier step.');
  }
  return { data, filename };
}

const MAX_URLS = 100;

type MultipartPart = { name: string; value: string | Buffer; filename?: string };

export type MultipartBody = { body: Buffer; contentType: string };
