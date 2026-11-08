import { AppConnectionValueForAuthProperty, OutputSchema } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { pdfcrowdAuth } from './auth';
import { getAuthHeader, getConvertUrl } from './client';

export async function pdfcrowdConvert(params: PdfcrowdConvertParams): Promise<PdfcrowdConversionResult> {
  const { result } = await pdfcrowdConvertWithData(params);
  return result;
}

export async function pdfcrowdConvertWithData({
  auth,
  files,
  fields,
  attachments = [],
  filename,
  converterVersion,
}: PdfcrowdConvertParams): Promise<{ result: PdfcrowdConversionResult; data: Buffer }> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    formData.append(key, String(value));
  }
  for (const attachment of attachments) {
    formData.append(attachment.field, attachment.data, { filename: attachment.filename });
  }
  const dispatcher = await verifiedTls();
  let response;
  try {
    response = await httpClient.sendRequest(
      {
        method: HttpMethod.POST,
        url: getConvertUrl(converterVersion),
        headers: {
          Authorization: getAuthHeader(auth),
          'User-Agent': 'pdfcrowd-activepieces/1.1.0',
          ...formData.getHeaders(),
        },
        body: formData.getBuffer(),
        responseType: 'arraybuffer',
        followRedirects: false,
        timeout: CONVERT_TIMEOUT_MS,
        redactBodyInErrors: true,
      },
      { dispatcher },
    );
  } catch (e) {
    if (e instanceof HttpError) {
      const text = decodeBody(e.response.body).trim().slice(0, 1000);
      throw new Error(`Pdfcrowd conversion failed (${e.response.status}): ${text}`);
    }
    if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      throw new Error(`Pdfcrowd conversion did not finish within ${CONVERT_TIMEOUT_MS / 1000} seconds.`);
    }
    throw new Error(`Could not reach Pdfcrowd: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Pdfcrowd conversion failed (${response.status}): Unexpected response status.`);
  }
  const data = Buffer.from(response.body);
  const headers = response.headers ?? {};
  const fileName = typeof filename === 'function' ? filename(headerValue(headers['content-type']) ?? '') : filename;
  const file = await files.write({ fileName, data });
  const result = {
    file,
    filename: fileName,
    jobId: headerValue(headers['x-pdfcrowd-job-id']) ?? '',
    pageCount: headerValue(headers['x-pdfcrowd-pages']) ?? '0',
    outputSize: headerValue(headers['x-pdfcrowd-output-size']) ?? '0',
    consumedCredits: headerValue(headers['x-pdfcrowd-consumed-credits']) ?? '0',
    remainingCredits: headerValue(headers['x-pdfcrowd-remaining-credits']) ?? '0',
  };
  return { result, data };
}

export function requireFile({ value, label, field }: { value: unknown; label: string; field: string }): PdfcrowdAttachment {
  if (!isFileLike(value)) {
    throw new Error(`${label} must be a file (upload it or pass a file from an earlier step).`);
  }
  return { field, data: Buffer.from(value.data), filename: value.filename || 'input' };
}

export function baseName({ name, fallback }: { name: string | undefined; fallback: string }): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return fallback;
  }
  const dot = trimmed.lastIndexOf('.');
  return dot > 0 ? trimmed.slice(0, dot) : trimmed;
}

export function readAttachments({ values, fieldNames }: { values: Record<string, unknown>; fieldNames: string[] }): PdfcrowdAttachment[] {
  const attachments: PdfcrowdAttachment[] = [];
  for (const field of fieldNames) {
    const value = values[field];
    if (isFileLike(value)) {
      attachments.push({ field, data: Buffer.from(value.data), filename: value.filename || `${field}.pdf` });
    }
  }
  return attachments;
}

export function pickSource({ url, html }: { url?: string; html?: string }): { url: string } | { text: string } {
  const trimmedUrl = url?.trim();
  const text = html !== undefined && html.trim() !== '' ? html : undefined;
  if (trimmedUrl && text !== undefined) {
    throw new Error('Provide either a URL or HTML, not both.');
  }
  if (trimmedUrl) {
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      throw new Error('The URL must start with http:// or https://.');
    }
    return { url: trimmedUrl };
  }
  if (text !== undefined) {
    return { text };
  }
  throw new Error('Provide a URL or HTML to convert.');
}

export function withExtension({ name, fallback, extension }: { name: string | undefined; fallback: string; extension: string }): string {
  const base = name?.trim() || fallback;
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

export function fileOf(item: unknown): unknown {
  return typeof item === 'object' && item !== null && 'file' in item ? item.file : undefined;
}

export const conversionOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url', description: 'The generated file. Pass it to any step that takes a file.' },
    { key: 'filename', label: 'File Name' },
    { key: 'jobId', label: 'Job ID' },
    { key: 'pageCount', label: 'Page Count', format: 'number', description: 'Pages reported by Pdfcrowd (x-pdfcrowd-pages). 0 when Pdfcrowd does not report it, e.g. for HTML to image and image to PDF.' },
    { key: 'outputSize', label: 'Output Size', format: 'filesize', description: 'Size of the output in bytes.' },
    { key: 'consumedCredits', label: 'Consumed Credits', format: 'number' },
    { key: 'remainingCredits', label: 'Remaining Credits', format: 'number' },
  ],
};


export const textConversionOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Text', description: 'The extracted text.' },
    ...conversionOutputSchema.fields,
  ],
};

function isFileLike(value: unknown): value is { data: Uint8Array; filename?: string } {
  return typeof value === 'object' && value !== null && 'data' in value && value.data instanceof Uint8Array;
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function decodeBody(body: unknown): string {
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body).toString('utf-8');
  }
  if (Buffer.isBuffer(body)) {
    return body.toString('utf-8');
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body) ?? '';
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const CONVERT_TIMEOUT_MS = 480000;

type PdfcrowdAttachment = { field: string; data: Buffer; filename: string };

type PdfcrowdConvertParams = {
  auth: AppConnectionValueForAuthProperty<typeof pdfcrowdAuth>;
  files: { write: (params: { fileName: string; data: Buffer }) => Promise<string> };
  fields: Record<string, unknown>;
  attachments?: PdfcrowdAttachment[];
  filename: string | ((contentType: string) => string);
  converterVersion?: string;
};

type PdfcrowdConversionResult = {
  file: string;
  filename: string;
  jobId: string;
  pageCount: string;
  outputSize: string;
  consumedCredits: string;
  remainingCredits: string;
};
