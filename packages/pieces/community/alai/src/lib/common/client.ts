import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const BASE_URL = 'https://slides-api.getalai.com';
const API_PREFIX = '/api/v1';
const POLL_INTERVAL_MS = 5_000;
const FIRST_POLL_DELAY_MS = 1_000;
const MAX_WAIT_SECONDS = 480;
const DEFAULT_WAIT_SECONDS = 300;
const EARLY_NOT_FOUND_POLLS = 3;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class AlaiApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'AlaiApiError';
  }
}

const STATUS_HINTS: Record<number, string> = {
  400: 'Alai rejected the request (HTTP 400).',
  401: 'Alai rejected the API key (HTTP 401). Check the key in the connection.',
  402: 'Your Alai account does not have enough AI credits for this (HTTP 402). Add credits or upgrade the plan in Alai.',
  403: 'The Alai API key is not allowed to do this (HTTP 403).',
  404: 'Alai could not find that item (HTTP 404). Check the ID.',
  422: 'Alai could not process the input (HTTP 422).',
  429: 'Alai rate limit reached (HTTP 429). Alai allows 5 generations at the same time per user; try again shortly.',
  500: 'Alai had an internal error (HTTP 500). Try again later.',
};

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: Reflect.get(response, 'body') };
}

function vendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body.length > 0 ? body.slice(0, 500) : undefined;
  }
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const detail: unknown = Reflect.get(body, 'detail');
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const loc: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'loc') : undefined;
        const msg: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'msg') : undefined;
        const where = Array.isArray(loc) ? loc.join('.') : '';
        return typeof msg === 'string' ? (where ? `${where}: ${msg}` : msg) : JSON.stringify(item);
      })
      .join('; ');
  }
  const message: unknown = Reflect.get(body, 'message');
  return typeof message === 'string' ? message : undefined;
}

function toAlaiError({ status, body }: { status: number; body: unknown }): AlaiApiError {
  const prefix = STATUS_HINTS[status] ?? `Alai API request failed (HTTP ${status}).`;
  const message = vendorMessage(body);
  return new AlaiApiError(message ? `${prefix} ${message}` : prefix, status, body);
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey.trim()}` };
}

async function request<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: HttpRequest['body'];
}): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders(apiKey), Accept: 'application/json' };
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url: `${BASE_URL}${API_PREFIX}${path}`,
        headers,
        body,
        followRedirects: false,
        redactBodyInErrors: true,
      },
      { dispatcher: await verifiedTls() }
    );
    if (response.status >= 300) {
      throw new AlaiApiError(`Alai answered with an unexpected redirect (HTTP ${response.status}).`, response.status, response.body);
    }
    return response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (!failure) {
      throw error;
    }
    throw toAlaiError(failure);
  }
}

function pathId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error(`${label} "${text}" is not a valid Alai ID (letters, digits, "-" and "_" only).`);
  }
  return encodeURIComponent(text);
}

export type AlaiTranscript = {
  slide_id: string | null;
  slide_order: number | null;
  title: string | null;
  content: string | null;
  layout: string | null;
};

export type AlaiGeneration = {
  generation_id: string;
  status: string;
  completed: boolean;
  error: string | null;
  created_at: string | null;
  completed_at: string | null;
  generation_type: string | null;
  presentation_id: string | null;
  slide_id: string | null;
  link_url: string | null;
  pdf_url: string | null;
  ppt_url: string | null;
  formats: Record<string, { status: string | null; url: string | null; error: string | null }>;
  transcripts: AlaiTranscript[] | null;
};

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null;
}

function normalizeGeneration({ raw, fallbackId }: { raw: unknown; fallbackId?: string }): AlaiGeneration {
  const body = typeof raw === 'object' && raw !== null ? raw : {};
  const rawFormats: unknown = Reflect.get(body, 'formats');
  const formats: AlaiGeneration['formats'] = {};
  if (typeof rawFormats === 'object' && rawFormats !== null) {
    for (const [key, entry] of Object.entries(rawFormats)) {
      const item = typeof entry === 'object' && entry !== null ? entry : {};
      formats[key] = {
        status: str(Reflect.get(item, 'status')),
        url: str(Reflect.get(item, 'url')),
        error: str(Reflect.get(item, 'error')),
      };
    }
  }
  const rawTranscripts: unknown = Reflect.get(body, 'transcripts');
  const transcripts = Array.isArray(rawTranscripts)
    ? rawTranscripts.map((entry) => {
        const item = typeof entry === 'object' && entry !== null ? entry : {};
        const order: unknown = Reflect.get(item, 'slide_order');
        return {
          slide_id: str(Reflect.get(item, 'slide_id')),
          slide_order: typeof order === 'number' ? order : null,
          title: str(Reflect.get(item, 'title')),
          content: str(Reflect.get(item, 'content')),
          layout: str(Reflect.get(item, 'layout')),
        };
      })
    : null;
  const status = str(Reflect.get(body, 'status')) ?? 'pending';
  return {
    generation_id: str(Reflect.get(body, 'generation_id')) ?? fallbackId ?? '',
    status,
    completed: status === 'completed',
    error: str(Reflect.get(body, 'error')),
    created_at: str(Reflect.get(body, 'created_at')),
    completed_at: str(Reflect.get(body, 'completed_at')),
    generation_type: str(Reflect.get(body, 'generation_type')),
    presentation_id: str(Reflect.get(body, 'presentation_id')),
    slide_id: str(Reflect.get(body, 'slide_id')),
    link_url: formats['link']?.url ?? null,
    pdf_url: formats['pdf']?.url ?? null,
    ppt_url: formats['ppt']?.url ?? null,
    formats,
    transcripts,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitSeconds(value: unknown): number {
  if (value === undefined || value === null || value === '' || Number(value) === 0) {
    return DEFAULT_WAIT_SECONDS;
  }
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('Max Wait Time must be a positive number of seconds.');
  }
  return Math.min(seconds, MAX_WAIT_SECONDS);
}

async function getGeneration({ apiKey, generationId }: { apiKey: string; generationId: string }): Promise<AlaiGeneration> {
  const body = await request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: `/generations/${pathId({ value: generationId, label: 'Generation ID' })}`,
  });
  return normalizeGeneration({ raw: body, fallbackId: generationId });
}

function assertFormatsSucceeded({ generation, requested }: { generation: AlaiGeneration; requested: string[] }): void {
  const failed = requested.filter((format) => generation.formats[format]?.status === 'failed');
  if (failed.length > 0) {
    const reasons = failed.map((format) => `${format}: ${generation.formats[format]?.error ?? 'unknown error'}`).join('; ');
    throw new Error(`Alai finished generation ${generation.generation_id} but these exports failed: ${reasons}`);
  }
}

async function waitForGeneration({
  apiKey,
  generationId,
  maxWaitTime,
  requestedFormats,
}: {
  apiKey: string;
  generationId: string;
  maxWaitTime: unknown;
  requestedFormats: string[];
}): Promise<AlaiGeneration> {
  const limitMs = waitSeconds(maxWaitTime) * 1000;
  const started = Date.now();
  await sleep(FIRST_POLL_DELAY_MS);
  for (let poll = 0; ; poll++) {
    let generation: AlaiGeneration | undefined;
    try {
      generation = await getGeneration({ apiKey, generationId });
    } catch (error) {
      if (!(error instanceof AlaiApiError && error.status === 404 && poll < EARLY_NOT_FOUND_POLLS)) {
        throw error;
      }
    }
    if (generation?.status === 'completed') {
      assertFormatsSucceeded({ generation, requested: requestedFormats });
      return generation;
    }
    if (generation?.status === 'failed') {
      throw new Error(`Alai generation ${generationId} failed: ${generation.error ?? 'unknown error'}`);
    }
    if (Date.now() - started + POLL_INTERVAL_MS > limitMs) {
      throw new Error(
        `Alai generation ${generationId} is still running after ${Math.round((Date.now() - started) / 1000)} seconds. Use "Get Generation" with this ID to check it later.`
      );
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

async function startGeneration({
  apiKey,
  path,
  body,
  waitForCompletion,
  maxWaitTime,
  requestedFormats,
}: {
  apiKey: string;
  path: string;
  body: Record<string, unknown>;
  waitForCompletion: unknown;
  maxWaitTime: unknown;
  requestedFormats: string[];
}): Promise<AlaiGeneration> {
  if (waitForCompletion === true) {
    waitSeconds(maxWaitTime);
  }
  const response = await request<unknown>({ apiKey, method: HttpMethod.POST, path, body });
  const generationId = typeof response === 'object' && response !== null ? str(Reflect.get(response, 'generation_id')) : null;
  if (!generationId) {
    throw new Error('Alai did not return a generation_id for this request.');
  }
  if (waitForCompletion !== true) {
    return normalizeGeneration({ raw: response, fallbackId: generationId });
  }
  return waitForGeneration({ apiKey, generationId, maxWaitTime, requestedFormats });
}

function exportFormats(value: unknown): string[] {
  const allowed = ['link', 'pdf', 'ppt'];
  const list = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value];
  const formats = [...new Set(list.map((item) => String(item).trim().toLowerCase()).filter((item) => item.length > 0))];
  const invalid = formats.filter((item) => !allowed.includes(item));
  if (invalid.length > 0) {
    throw new Error(`Unknown export format(s): ${invalid.join(', ')}. Use link, pdf or ppt.`);
  }
  return formats;
}

export const alaiClient = {
  baseUrl: BASE_URL,
  apiPrefix: API_PREFIX,
  maxWaitSeconds: MAX_WAIT_SECONDS,
  authHeaders,
  verifiedTls,
  request,
  pathId,
  getGeneration,
  startGeneration,
  exportFormats,
  toAlaiError,
  readHttpFailure,
};
