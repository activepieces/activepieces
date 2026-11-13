import { Readable } from 'stream';
import { httpClient, HttpMessageBody, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const PANDADOC_API_BASE = 'https://api.pandadoc.com/public/v1';

export type PandaDocQuery = Record<string, string | number | boolean | string[] | undefined | null>;

export class PandaDocApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'PandaDocApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function encodeId({ id, label }: { id: unknown; label: string }): string {
  const trimmed = typeof id === 'string' ? id.trim() : typeof id === 'number' ? String(id) : '';
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(trimmed);
}

export function buildPandaDocUrl({ path, query, flag }: { path: string; query?: PandaDocQuery; flag?: string }): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call PandaDoc with an unexpected path: ${path}`);
  }
  const url = new URL(PANDADOC_API_BASE + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item.length > 0) {
            url.searchParams.append(key, item);
          }
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  const built = url.toString();
  if (flag === undefined) {
    return built;
  }
  return `${built}${url.search.length > 0 ? '&' : '?'}${encodeURIComponent(flag)}`;
}

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export async function pandadocRequest<T extends HttpMessageBody = HttpMessageBody>({
  apiKey,
  method,
  path,
  query,
  body,
  flag,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: PandaDocQuery;
  flag?: string;
  body?: unknown;
  timeoutMs?: number;
}): Promise<{ status: number; body: T }> {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `API-Key ${apiKey.trim()}`,
    Accept: 'application/json',
  };
  if (body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json';
  }
  const request: HttpRequest = {
    method,
    url: buildPandaDocUrl({ path, query, flag }),
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    redactBodyInErrors: true,
    timeout: timeoutMs,
  };
  try {
    const response = await httpClient.sendRequest<T>(request, { dispatcher: await verifiedTls() });
    return { status: response.status, body: response.body };
  } catch (error) {
    throw mapPandaDocError(error);
  }
}

export async function pandadocDownload({
  apiKey,
  path,
  query,
  timeoutMs = DOWNLOAD_TIMEOUT_MS,
  maxBytes = MAX_DOWNLOAD_BYTES,
}: {
  apiKey: string;
  path: string;
  query?: PandaDocQuery;
  timeoutMs?: number;
  maxBytes?: number;
}): Promise<{ data: Buffer; fileName: string | null; contentType: string | null }> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: buildPandaDocUrl({ path, query }),
    headers: {
      Authorization: `API-Key ${apiKey.trim()}`,
      Accept: 'application/pdf, application/zip, application/octet-stream, */*',
    },
    responseType: 'stream',
    timeout: timeoutMs,
  };
  let response;
  try {
    response = await httpClient.sendRequest<Readable>(request, { dispatcher: await verifiedTls() });
  } catch (error) {
    throw mapPandaDocError(error);
  }
  const data = await readStream({ stream: response.body, timeoutMs, maxBytes });
  return {
    data,
    fileName: fileNameFromDisposition(headerString(response.headers?.['content-disposition'])),
    contentType: headerString(response.headers?.['content-type']),
  };
}

function headerString(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function fileNameFromDisposition(disposition: string | null): string | null {
  if (disposition === null) {
    return null;
  }
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(disposition);
  if (encoded) {
    try {
      return sanitizeFileName(decodeURIComponent(encoded[1].trim()));
    } catch {
      return sanitizeFileName(encoded[1].trim());
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(disposition);
  return plain ? sanitizeFileName(plain[1].trim()) : null;
}

export function sanitizeFileName(name: string): string | null {
  const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 200) : null;
}

function readStream({ stream, timeoutMs, maxBytes }: { stream: Readable; timeoutMs: number; maxBytes: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const timer = setTimeout(() => {
      stream.destroy(new Error(`PandaDoc download did not finish within ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
    stream.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      total += buffer.length;
      if (total > maxBytes) {
        stream.destroy(new Error(`PandaDoc file is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`));
        return;
      }
      chunks.push(buffer);
    });
    stream.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
    stream.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export function mapPandaDocError(error: unknown): unknown {
  if (error instanceof PandaDocApiError) {
    return error;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return error;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return error;
  }
  return buildPandaDocError({ status: response['status'], responseBody: response['body'] });
}

export function isPandaDocStatus({ error, statuses }: { error: unknown; statuses: number[] }): boolean {
  const mapped = mapPandaDocError(error);
  return mapped instanceof PandaDocApiError && statuses.includes(mapped.status);
}

export function vendorDetail(responseBody: unknown): string | undefined {
  let parsed = responseBody;
  if (Buffer.isBuffer(parsed)) {
    parsed = parsed.toString('utf8');
  }
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.startsWith('<') ? undefined : trimmed.slice(0, MAX_DETAIL);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const detail = parsed['detail'] ?? parsed['info_message'] ?? parsed['message'] ?? parsed['error'];
  if (typeof detail === 'string') {
    return detail.slice(0, MAX_DETAIL);
  }
  if (detail === undefined || detail === null) {
    return undefined;
  }
  return JSON.stringify(detail).slice(0, MAX_DETAIL);
}

export function buildPandaDocError({ status, responseBody }: { status: number; responseBody: unknown }): PandaDocApiError {
  const detailText = vendorDetail(responseBody);
  const base = detailText !== undefined && /key type is not permitted/i.test(detailText)
    ? 'PandaDoc does not allow this type of API key (for example a sandbox key) to use this feature. Use a production API key'
    : STATUS_MESSAGES[status] ?? (status >= 500 ? 'PandaDoc returned a server error. Retry later' : 'PandaDoc request failed');
  const message = detailText === undefined ? `${base} (HTTP ${status}).` : `${base} (HTTP ${status}): ${detailText}`;
  return new PandaDocApiError({ message, status, responseBody });
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'PandaDoc rejected the request as invalid',
  401: 'PandaDoc rejected the API key. Check the API key in the PandaDoc connection',
  403: 'PandaDoc denied access. Check that the API key belongs to a workspace with access to this item, or that your plan includes this feature',
  404: 'PandaDoc could not find the item. Check the ID',
  409: 'PandaDoc reported a conflict. The document is probably not in the right status yet (for example still uploading, or already sent)',
  423: 'PandaDoc locked the document. Try again later',
  429: 'PandaDoc rate limit reached (sandbox keys allow 10 requests per minute per endpoint). Retry in a minute',
};

const DEFAULT_TIMEOUT_MS = 30000;
const DOWNLOAD_TIMEOUT_MS = 120000;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_DETAIL = 500;
