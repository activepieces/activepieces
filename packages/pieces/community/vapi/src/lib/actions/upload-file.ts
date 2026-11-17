import FormData from 'form-data';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

const MIME_TYPES: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  pdf: 'application/pdf',
  csv: 'text/csv',
  json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  html: 'text/html',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  tsv: 'text/tab-separated-values',
};

function mimeTypeFor({ filename, extension }: { filename: string; extension?: string }): string {
  const fromName = filename.includes('.') ? filename.split('.').pop() : undefined;
  const candidates = [fromName, extension].map((value) => value?.trim().replace(/^\./, '').toLowerCase());
  for (const candidate of candidates) {
    if (candidate && MIME_TYPES[candidate]) {
      return MIME_TYPES[candidate];
    }
  }
  throw new Error(
    `Unsupported file type for "${filename}". Vapi accepts: ${Object.keys(MIME_TYPES).map((ext) => `.${ext}`).join(', ')}.`
  );
}

function readFile(value: unknown): { filename: string; data: Buffer; extension?: string } {
  if (!vapiUtils.isRecord(value)) {
    throw new Error('File is required.');
  }
  const data = value['data'];
  const filename = value['filename'];
  if (!Buffer.isBuffer(data) || typeof filename !== 'string') {
    throw new Error('File could not be read. Select a file from a previous step or upload one.');
  }
  const extension = value['extension'];
  return { filename, data, extension: typeof extension === 'string' ? extension : undefined };
}

export const uploadFile = createAction({
  auth: vapiAuth,
  name: 'upload_file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Upload a file (PDF, DOCX, TXT, CSV, Markdown, ...) to Vapi for use in a knowledge base.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.file,
  props: {
    file: Property.File({ displayName: 'File', required: true }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional name to store the file under, including its extension. Defaults to the original name.',
      required: false,
    }),
  },
  async run(context) {
    const file = readFile(context.propsValue.file);
    const customName = context.propsValue.fileName?.trim();
    const filename = customName && customName !== '' ? customName : file.filename;
    const type = mimeTypeFor({ filename, extension: customName && customName !== '' ? undefined : file.extension });
    const form = new FormData();
    form.append('file', Buffer.from(file.data), { filename, contentType: type });
    const uploaded = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/file',
      operation: 'upload file',
      body: form,
      headers: form.getHeaders(),
    });
    return vapiUtils.stripSecrets(uploaded);
  },
});

export const uploadFileInternals = { mimeTypeFor };
