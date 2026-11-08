import { Readable } from 'node:stream';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

const MAX_VENDOR_TEXT = 500;
const UPLOAD_CHUNK_BYTES = 64 * 1024;

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function authHeader(apiKey: string): Record<string, string> {
  return { Authorization: `Token ${apiKey.trim()}` };
}

export class DeepgramApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly requestId: string | undefined;
  readonly responseBody: unknown;

  constructor({
    operation,
    status,
    responseBody,
    hint,
  }: {
    operation: string;
    status: number;
    responseBody: unknown;
    hint?: string;
  }) {
    const code = errorCode(responseBody);
    const vendor = maskUrlCredentials(vendorText(responseBody));
    const parts = [
      `Deepgram could not ${operation} (HTTP ${status}${
        code ? ` ${code}` : ''
      })`,
    ];
    const detail = vendor ? `: ${vendor}` : '.';
    const help = hint ?? statusHint(status);
    const requestId = requestIdOf(responseBody);
    super(
      `${parts[0]}${detail}${help ? ` ${help}` : ''}${
        requestId ? ` Deepgram request ID: ${requestId}.` : ''
      }`
    );
    this.name = 'DeepgramApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.responseBody = responseBody;
  }
}

async function request<T>({
  apiKey,
  method,
  path,
  query,
  body,
  headers,
  responseType,
  timeoutMs,
  operation,
  timeoutHint,
  baseUrl,
}: DeepgramRequestParams): Promise<DeepgramResponse<T>> {
  const url = buildUrl({ path, query, baseUrl });
  try {
    const dispatcher = await verifiedTls();
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url,
        headers: {
          ...authHeader(apiKey),
          Accept: 'application/json',
          ...(body !== undefined && !(body instanceof Readable)
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...headers,
        },
        body,
        responseType: responseType ?? 'json',
        timeout: timeoutMs,
        followRedirects: false,
      },
      { dispatcher }
    );
    if (response.status >= 300) {
      throw new DeepgramApiError({
        operation,
        status: response.status,
        responseBody: 'Deepgram answered with an unexpected redirect.',
      });
    }
    return {
      status: response.status,
      headers: response.headers ?? {},
      body: response.body,
    };
  } catch (error) {
    if (error instanceof DeepgramApiError) {
      throw error;
    }
    const status = statusOf(error);
    if (status !== undefined) {
      throw new DeepgramApiError({
        operation,
        status,
        responseBody: decodeBody(responseBodyOf(error)),
        hint: status === 504 && timeoutHint ? timeoutHint : undefined,
      });
    }
    if (isAbort(error)) {
      throw new Error(
        `Deepgram did not answer within ${Math.round(
          timeoutMs / 1000
        )} seconds while trying to ${operation}.${
          timeoutHint ? ` ${timeoutHint}` : ''
        }`
      );
    }
    throw error;
  }
}

function buildUrl({
  path,
  query,
  baseUrl,
}: {
  path: string;
  query?: QueryInput;
  baseUrl?: string;
}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const text = String(item);
      if (text.length > 0) {
        params.append(key, text);
      }
    }
  }
  const search = params.toString();
  return `${baseUrl ?? BASE_URL}${path}${search ? `?${search}` : ''}`;
}

function audioUploadBody(data: Buffer): Readable {
  const size = data.length;
  function* chunks() {
    for (let offset = 0; offset < size; offset += UPLOAD_CHUNK_BYTES) {
      yield data.subarray(offset, Math.min(offset + UPLOAD_CHUNK_BYTES, size));
    }
  }
  const stream = Readable.from(chunks());
  Object.defineProperty(stream, 'toJSON', {
    value: () => `[audio upload, ${size} bytes]`,
    enumerable: false,
  });
  return stream;
}

function maskUrlCredentials(value: string): string {
  return maskAuthorities(maskParsedUrl(value));
}

function maskParsedUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (url.username === '' && url.password === '') {
    return value;
  }
  url.username = '***';
  url.password = '';
  return url.toString();
}

function maskAuthorities(value: string): string {
  return URL_SCHEME_FORMS.reduce(
    (text, form) =>
      text.replace(
        form.authority,
        (match, scheme: string, authority: string) => {
          const at = authority.toLowerCase().lastIndexOf(form.at);
          return at < 0 ? match : `${scheme}***${authority.slice(at)}`;
        }
      ),
    value
  );
}

const URL_SCHEME_FORMS = [
  { authority: /(:\/\/)([^/?#\s"'<>]*)/g, at: '@' },
  {
    authority: /(%3A%2F%2F)((?:(?!%2F|%3F|%23)[^&\s"'<>])*)/gi,
    at: '%40',
  },
];

function maskOptional(value: unknown): string | null {
  return typeof value === 'string' ? maskUrlCredentials(value) : null;
}

function vendorText(responseBody: unknown): string {
  if (typeof responseBody === 'string') {
    return truncate(responseBody.trim());
  }
  if (!isRecord(responseBody)) {
    return '';
  }
  const pieces = [
    responseBody['err_msg'],
    responseBody['message'],
    responseBody['details'],
  ].filter(
    (item, index, all): item is string =>
      typeof item === 'string' && item.length > 0 && all.indexOf(item) === index
  );
  return truncate(pieces.join(' - '));
}

function errorCode(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody)) {
    return undefined;
  }
  const code = responseBody['err_code'] ?? responseBody['category'];
  return typeof code === 'string' && code.length > 0 ? code : undefined;
}

function requestIdOf(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody)) {
    return undefined;
  }
  const id = responseBody['request_id'];
  return typeof id === 'string' ? id : undefined;
}

function statusHint(status: number): string | undefined {
  if (status === 401) {
    return 'Check that the API key is correct and has permission for this action.';
  }
  if (status === 403) {
    return "This API key's role or scopes do not allow this action. Use a key with the Member, Admin or Owner role; members, keys, balances and costs need Admin or Owner.";
  }
  if (status === 402) {
    return 'The Deepgram project is out of credit. Add funds or a card in the Deepgram Console.';
  }
  if (status === 404) {
    return 'Check the project or request ID.';
  }
  if (status === 413) {
    return 'The input is too large for Deepgram.';
  }
  if (status === 429) {
    return 'Deepgram rate limit reached. Wait a moment and try again.';
  }
  if (status === 504) {
    return 'Deepgram took too long to process the request.';
  }
  if (status >= 500) {
    return 'Deepgram had a server error. Try again later.';
  }
  return undefined;
}

function truncate(text: string): string {
  return text.length > MAX_VENDOR_TEXT
    ? `${text.slice(0, MAX_VENDOR_TEXT)}...`
    : text;
}

function statusOf(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response['status'];
  return typeof status === 'number' ? status : undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function decodeBody(body: unknown): unknown {
  const text = bytesToText(body) ?? (typeof body === 'string' ? body : null);
  if (text === null) {
    return body;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : text;
  } catch {
    return text;
  }
}

function bytesToText(body: unknown): string | null {
  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body).toString('utf8');
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength).toString(
      'utf8'
    );
  }
  return null;
}

function isAbort(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }
  const name = Reflect.get(error, 'name');
  return name === 'AbortError' || name === 'TimeoutError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const deepgramClient = {
  request,
  authHeader,
  buildUrl,
  audioUploadBody,
  maskUrlCredentials,
  maskOptional,
  vendorText,
  isRecord,
};

export const DEEPGRAM_TIMEOUTS = {
  listen: 480_000,
  speak: 120_000,
  read: 120_000,
  manage: 30_000,
};

export const LONG_AUDIO_HINT =
  'Use Create Transcription (Callback) for recordings that take longer to process.';

type QueryValue = string | number | boolean | undefined | null;

export type QueryInput = Record<string, QueryValue | QueryValue[]>;

export type DeepgramRequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: QueryInput;
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: 'json' | 'arraybuffer';
  timeoutMs: number;
  operation: string;
  timeoutHint?: string;
  baseUrl?: string;
};

export type DeepgramResponse<T> = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: T;
};
