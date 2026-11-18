import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const ZOOM_REQUEST_TIMEOUT_MS = 30000;
const DETAIL_MAX_LENGTH = 500;

export class ZoomApiError extends Error {
  readonly status: number;
  readonly code: number | undefined;
  readonly responseBody: unknown;

  constructor({
    status,
    code,
    message,
    responseBody,
  }: {
    status: number;
    code: number | undefined;
    message: string;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'ZoomApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function zoomCode(body: unknown): number | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const code = body['code'];
  if (typeof code === 'number') {
    return code;
  }
  if (typeof code === 'string' && /^\d+$/.test(code)) {
    return Number(code);
  }
  return undefined;
}

function zoomDetail(body: unknown): string {
  if (isRecord(body)) {
    const message = body['message'];
    if (typeof message === 'string' && message.trim().length > 0) {
      return withoutTrailingPeriods(message.trim().slice(0, DETAIL_MAX_LENGTH));
    }
    return JSON.stringify(body).slice(0, DETAIL_MAX_LENGTH);
  }
  if (typeof body === 'string' && body.trim().length > 0) {
    return withoutTrailingPeriods(body.trim().slice(0, DETAIL_MAX_LENGTH));
  }
  return 'no details returned';
}

function withoutTrailingPeriods(text: string): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === '.') {
    end--;
  }
  return text.slice(0, end);
}

function missingScopes({ detail, scope }: { detail: string; scope: string | undefined }): string {
  const match = /scopes?\s*:\s*\[([^\]]*)\]/i.exec(detail);
  if (match && match[1].trim().length > 0) {
    return match[1].trim();
  }
  return scope ?? 'required by this action';
}

function zoomErrorMessage({
  status,
  responseBody,
  scope,
}: {
  status: number;
  responseBody: unknown;
  scope?: string;
}): string {
  const code = zoomCode(responseBody);
  const detail = zoomDetail(responseBody);
  if (code === 4711 || /does not contain scopes/i.test(detail)) {
    return `Your Zoom app is missing the scope ${missingScopes({ detail, scope })}. Add it under Scopes in your Zoom Marketplace app, then reconnect this Zoom connection. Zoom said: ${detail}.`;
  }
  if (code === 200 && /paid|ZMP/i.test(detail)) {
    return `This Zoom feature needs a paid (Pro or higher) Zoom plan on the connected account. Zoom said: ${detail}.`;
  }
  switch (status) {
    case 400:
      return `Zoom rejected the request (400, code ${code ?? 'none'}): ${detail}. Check the values you entered; some features (registration, cloud recording) need a paid Zoom plan.`;
    case 401:
      return `Zoom did not accept the connection (401): ${detail}. Reconnect your Zoom account.`;
    case 403:
      return `Zoom refused access (403): ${detail}. The connected Zoom user lacks permission for this data, or the feature needs a paid Zoom plan.`;
    case 404:
      return `Zoom could not find it (404, code ${code ?? 'none'}): ${detail}. Check the meeting ID.`;
    case 429:
      return `Zoom rate limit reached (429): ${detail}. Wait a moment and try again; Zoom limits requests per second and per day by plan.`;
    default:
      return `Zoom request failed with HTTP ${status}: ${detail}.`;
  }
}

function failureOf(error: unknown): { status: number; responseBody: unknown } | undefined {
  const response = isRecord(error) && isRecord(error['response']) ? error['response'] : undefined;
  const status = response?.['status'];
  if (typeof status !== 'number') {
    return undefined;
  }
  return { status, responseBody: response?.['body'] };
}

function isAbortError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && isRecord(current); depth++) {
    if (current['name'] === 'AbortError' || current['name'] === 'TimeoutError' || current['code'] === 'ABORT_ERR') {
      return true;
    }
    current = current['cause'];
  }
  return false;
}

function toQueryParams(query: ZoomQuery | undefined): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      params[key] = String(value);
    }
  }
  return params;
}

function assertApiPath(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..') || path.includes('?') || path.includes('#') || path.includes('://')) {
    throw new Error(`Refusing to call an unexpected Zoom path: "${path}".`);
  }
}

async function zoomRequest<T>({
  accessToken,
  method,
  path,
  query,
  body,
  scope,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  query?: ZoomQuery;
  body?: Record<string, unknown>;
  scope?: string;
}): Promise<{ status: number; body: T | undefined }> {
  assertApiPath(path);
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${ZOOM_API_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      queryParams: toQueryParams(query),
      body,
      timeout: ZOOM_REQUEST_TIMEOUT_MS,
    });
    if (response.status < 200 || response.status >= 300) {
      throw new ZoomApiError({
        status: response.status,
        code: zoomCode(response.body),
        message: zoomErrorMessage({ status: response.status, responseBody: response.body, scope }),
        responseBody: response.body,
      });
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    if (error instanceof ZoomApiError) {
      throw error;
    }
    if (isAbortError(error)) {
      throw new Error(`Zoom did not answer within ${ZOOM_REQUEST_TIMEOUT_MS / 1000} seconds (${method} ${path}), so the request timed out. Try again in a moment; if it keeps happening, Zoom may be having an outage.`);
    }
    const failure = failureOf(error);
    if (failure === undefined) {
      throw error;
    }
    throw new ZoomApiError({
      status: failure.status,
      code: zoomCode(failure.responseBody),
      message: zoomErrorMessage({ ...failure, scope }),
      responseBody: failure.responseBody,
    });
  }
}

async function zoomRequestObject({
  accessToken,
  method,
  path,
  query,
  body,
  scope,
}: Parameters<typeof zoomRequest>[0]): Promise<Record<string, unknown>> {
  const response = await zoomRequest<unknown>({ accessToken, method, path, query, body, scope });
  if (!isRecord(response.body)) {
    throw new Error(`Zoom returned an unexpected response for ${path}: ${JSON.stringify(response.body ?? null).slice(0, 200)}`);
  }
  return response.body;
}

function normalizeMeetingId(raw: unknown): string {
  const text = String(raw ?? '').replace(/[\s-]/g, '');
  if (!/^\d{1,19}$/.test(text)) {
    throw new Error(`"${String(raw ?? '')}" is not a Zoom meeting ID. A meeting ID is a number such as 85746065432 (spaces and dashes are allowed).`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pageSizeOf({ value, fallback }: { value: unknown; fallback: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > 300) {
    throw new Error('Page Size must be a whole number from 1 to 300.');
  }
  return size;
}

function listPage({
  body,
  itemsKey,
}: {
  body: Record<string, unknown>;
  itemsKey: string;
}): Record<string, unknown> {
  const items = body[itemsKey];
  const token = body['next_page_token'];
  return {
    ...body,
    [itemsKey]: Array.isArray(items) ? items : [],
    next_page_token: typeof token === 'string' && token.length > 0 ? token : null,
    has_more: typeof token === 'string' && token.length > 0,
  };
}

export const zoomClient = {
  baseUrl: ZOOM_API_BASE_URL,
  timeoutMs: ZOOM_REQUEST_TIMEOUT_MS,
  request: zoomRequest,
  requestObject: zoomRequestObject,
  errorMessage: zoomErrorMessage,
  normalizeMeetingId,
  optionalText,
  pageSizeOf,
  listPage,
  isRecord,
};

type ZoomQuery = Record<string, string | number | boolean | undefined>;
