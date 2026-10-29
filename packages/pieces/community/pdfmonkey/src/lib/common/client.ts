import { Readable } from 'stream';
import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.pdfmonkey.io/api/v1';

const REQUEST_TIMEOUT_MS = 30000;
const SYNC_TIMEOUT_MS = 420000;
const DOWNLOAD_TIMEOUT_MS = 120000;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

let verifiedTlsAgent: Promise<unknown> | undefined;

export class PdfmonkeyApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly responseBody: unknown) {
    super(message);
    this.name = 'PdfmonkeyApiError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function apiKeyOf(auth: unknown): string {
  const raw = isRecord(auth) ? auth['secret_text'] : auth;
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (!key) {
    throw new Error('The PDFMonkey connection has no API key. Reconnect your PDFMonkey account.');
  }
  return key;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const errors = body['errors'];
    if (isRecord(errors)) {
      const parts = Object.entries(errors).map(([field, value]) => `${field} ${Array.isArray(value) ? value.join(', ') : String(value)}`);
      if (parts.length > 0) return parts.join('; ');
    }
    if (Array.isArray(errors) && errors.length > 0) {
      return errors
        .map((item) => (isRecord(item) ? String(item['detail'] ?? item['title'] ?? JSON.stringify(item)) : String(item)))
        .join('; ');
    }
    const message = body['message'] ?? body['error'];
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  if (typeof body === 'string' && body.trim()) {
    return body.trim().slice(0, 300);
  }
  return 'request failed';
}

function hintFor(status: number): string {
  if (status === 401) return ' Check the API key or reconnect your PDFMonkey account.';
  if (status === 403) return ' This API key has no access to this resource.';
  if (status === 404) return ' Check the ID; the resource does not exist or belongs to another workspace.';
  if (status === 429) return ' PDFMonkey rate limit reached; try again later.';
  return '';
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function toApiError({ status, body }: { status: number; body: unknown }): PdfmonkeyApiError {
  const message = vendorMessage(body).replace(/\.$/, '');
  return new PdfmonkeyApiError(`PDFMonkey API error (${status}): ${message}.${hintFor(status)}`, status, body);
}

async function request<T = unknown>({
  auth,
  method,
  path,
  query,
  body,
  timeout,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
  timeout?: number;
}): Promise<{ status: number; body: T }> {
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKeyOf(auth)}`,
    Accept: 'application/json',
  };
  if (hasBody) headers['Content-Type'] = 'application/json';
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url: `${BASE_URL}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout: timeout ?? REQUEST_TIMEOUT_MS,
        followRedirects: false,
        redactBodyInErrors: hasBody,
      },
      { dispatcher },
    );
    if (response.status >= 300) {
      throw new PdfmonkeyApiError(`PDFMonkey API error (${response.status}): unexpected redirect.`, response.status, undefined);
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    const failure = failureOf(error);
    if (failure) throw toApiError(failure);
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(`PDFMonkey did not answer within ${Math.round((timeout ?? REQUEST_TIMEOUT_MS) / 1000)} seconds.`);
    }
    throw error;
  }
}

async function download({ url }: { url: string }): Promise<{ data: Buffer; contentType: string | undefined }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('PDFMonkey returned an invalid download URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('PDFMonkey returned a download URL that is not HTTPS.');
  }
  const dispatcher = await verifiedTls();
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
  let response;
  try {
    response = await httpClient.sendRequest<unknown>(
      {
        method: HttpMethod.GET,
        url: parsed.toString(),
        headers: { Accept: 'application/pdf, image/*, */*' },
        responseType: 'stream',
        timeout: DOWNLOAD_TIMEOUT_MS,
        followRedirects: false,
      },
      { dispatcher },
    );
  } catch (error) {
    const failure = failureOf(error);
    if (failure) {
      throw new Error(`Downloading the file failed with status ${failure.status}. The download link is valid for 1 hour; get the document again for a fresh link.`);
    }
    throw error;
  }
  if (response.status >= 300) {
    throw new Error(`Downloading the file failed with status ${response.status}.`);
  }
  const data = await readCapped({ body: response.body, deadline });
  const header = response.headers?.['content-type'];
  return { data, contentType: Array.isArray(header) ? header[0] : header };
}

async function readCapped({ body, deadline }: { body: unknown; deadline: number }): Promise<Buffer> {
  if (!(body instanceof Readable)) {
    throw new Error('PDFMonkey returned an empty file.');
  }
  const remaining = Math.max(deadline - Date.now(), 1);
  const timer = setTimeout(() => body.destroy(new Error(`The download did not finish within ${DOWNLOAD_TIMEOUT_MS / 1000} seconds.`)), remaining);
  try {
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of body) {
      const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += piece.length;
      if (total > MAX_DOWNLOAD_BYTES) {
        body.destroy();
        throw new Error('The file is larger than 100 MB and cannot be downloaded in a flow step.');
      }
      chunks.push(piece);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
  }
}

export const pdfmonkeyClient = { request, download, segment, isRecord, SYNC_TIMEOUT_MS };
