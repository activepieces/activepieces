import {
  HttpError,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Store } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.jogg.ai';
const MAX_SEEN_EVENTS = 400;

const KNOWN_CODES: Record<number, string> = {
  10104: 'Record not found',
  10105: 'Invalid API key',
  18020: 'Insufficient credit',
  18025: 'No permission to call APIs',
  40000: 'Parameter error',
  50000: 'System error',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readEnvelope(body: unknown): JoggAiEnvelope {
  if (typeof body === 'string') {
    try {
      return readEnvelope(JSON.parse(body));
    } catch {
      return { code: -1, msg: body.slice(0, 300) };
    }
  }
  if (!isRecord(body)) {
    return { code: -1, msg: 'empty response' };
  }
  const code = typeof body['code'] === 'number' ? body['code'] : -1;
  const msg = typeof body['msg'] === 'string' ? body['msg'] : '';
  return { ...body, code, msg, data: body['data'] };
}

function describeCode({ code, msg }: { code: number; msg: string }): string {
  const known = KNOWN_CODES[code];
  if (known && msg && msg.toLowerCase() !== known.toLowerCase()) {
    return `${known} - ${msg}`;
  }
  return known ?? (msg || 'Unknown error');
}

function isWrite(method: HttpMethod): boolean {
  return method !== HttpMethod.GET;
}

async function requestEnvelope({
  apiKey,
  method,
  path,
  op,
  body,
  queryParams,
}: JoggAiRequest): Promise<JoggAiEnvelope> {
  let raw: unknown;
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'x-api-key': apiKey.trim(),
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body,
      queryParams,
      timeout: 60000,
    });
    raw = response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const details = error.errorMessage();
      const envelope = readEnvelope(details.response.body);
      throw new JoggAiError({
        message: `JoggAI ${op} failed (HTTP ${details.response.status}${
          envelope.code === -1 ? '' : `, code ${envelope.code}`
        }): ${describeCode(envelope)}`,
        code: envelope.code,
        responseBody: details.response.body,
      });
    }
    const reason = error instanceof Error ? error.message : String(error);
    const suffix = isWrite(method)
      ? ' The request may still have been applied on JoggAI; check before retrying.'
      : '';
    throw new JoggAiError({
      message: `JoggAI ${op} failed: could not reach the JoggAI API (${reason}).${suffix}`,
      code: -1,
      responseBody: undefined,
    });
  }
  const envelope = readEnvelope(raw);
  if (envelope.code !== 0) {
    throw new JoggAiError({
      message: `JoggAI ${op} failed (${envelope.code}): ${describeCode(envelope)}`,
      code: envelope.code,
      responseBody: raw,
    });
  }
  return envelope;
}

async function request(params: JoggAiRequest): Promise<Record<string, unknown>> {
  const envelope = await requestEnvelope(params);
  return isRecord(envelope.data) ? envelope.data : {};
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function listOf({ value, key }: { value: Record<string, unknown>; key: string }): Record<string, unknown>[] {
  const items = value[key];
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

function pageParams({ page, pageSize }: { page: number | undefined; pageSize: number | undefined }): Record<string, string> {
  return {
    page: String(Math.max(Math.trunc(page ?? 1), 1)),
    page_size: String(Math.min(Math.max(Math.trunc(pageSize ?? 20), 1), 100)),
  };
}

function compact(values: Record<string, string | undefined | null>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' && value.trim() ? [[key, value.trim()]] : []
    )
  );
}

function toIntegerId({ value, label }: { value: string | number; label: string }): number {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`${label} must be a numeric JoggAI ID, e.g. 12345.`);
  }
  return Number(text);
}

async function registerWebhook({
  apiKey,
  url,
  events,
  store,
  storeKey,
}: {
  apiKey: string;
  url: string;
  events: string[];
  store: Store;
  storeKey: string;
}): Promise<void> {
  const data = await request({
    apiKey,
    method: HttpMethod.POST,
    path: '/v2/endpoint',
    op: 'register webhook',
    body: { url, status: 'enabled', events },
  });
  const endpointId = data['endpoint_id'];
  if (typeof endpointId !== 'string' && typeof endpointId !== 'number') {
    throw new Error(
      'JoggAI register webhook failed: the response did not include an endpoint_id, so the endpoint cannot be removed automatically. Delete it in the JoggAI dashboard before enabling again.'
    );
  }
  const secret = data['secret'];
  try {
    await store.put(storeKey, {
      endpoint_id: String(endpointId),
      ...(typeof secret === 'string' && secret.length > 0 ? { secret } : {}),
    });
  } catch (error) {
    await request({
      apiKey,
      method: HttpMethod.DELETE,
      path: `/v2/endpoint/${encodeURIComponent(String(endpointId))}`,
      op: 'delete webhook',
    }).catch(() => undefined);
    throw error;
  }
}

async function unregisterWebhook({
  apiKey,
  store,
  storeKey,
}: {
  apiKey: string;
  store: Store;
  storeKey: string;
}): Promise<void> {
  const saved = await store.get<unknown>(storeKey);
  const endpointId = isRecord(saved) ? saved['endpoint_id'] : undefined;
  if (typeof endpointId === 'string' && endpointId.length > 0) {
    try {
      await request({
        apiKey,
        method: HttpMethod.DELETE,
        path: `/v2/endpoint/${encodeURIComponent(endpointId)}`,
        op: 'delete webhook',
      });
    } catch (error) {
      if (!(error instanceof JoggAiError && error.code === 10104)) {
        throw error;
      }
    }
  }
  await store.delete(storeKey);
}

async function acceptEvent({
  payload,
  events,
  store,
  storeKey,
  dedupeKey,
}: {
  payload: { body: unknown; headers?: Record<string, string>; rawBody?: unknown };
  events: string[];
  store: Store;
  storeKey: string;
  dedupeKey: string;
}): Promise<Record<string, unknown>[]> {
  const body = payload.body;
  if (!isRecord(body) || typeof body['event'] !== 'string' || !events.includes(body['event'])) {
    return [];
  }
  const data = body['data'];
  if (!isRecord(data) || (data['video_id'] === undefined && data['project_id'] === undefined)) {
    return [];
  }
  const saved = await store.get<unknown>(storeKey);
  const secret = isRecord(saved) && typeof saved['secret'] === 'string' ? saved['secret'] : undefined;
  if (secret !== undefined) {
    const signature = headerValue({ headers: payload.headers, name: 'x-webhook-signature' });
    if (!signature || !isValidSignature({ secret, signature, rawBody: payload.rawBody })) {
      return [];
    }
  }
  const outcome = body['event'].endsWith('_failed') ? 'failed' : 'success';
  const videoKey = `${String(data['video_id'] ?? data['project_id'])}:${outcome}`;
  const eventId = body['event_id'];
  const keys = typeof eventId === 'string' && eventId.length > 0 ? [`event:${eventId}`, `video:${videoKey}`] : [`video:${videoKey}`];
  const seen = await store.get<unknown>(dedupeKey);
  const seenKeys = Array.isArray(seen) ? seen.filter((key): key is string => typeof key === 'string') : [];
  if (keys.some((key) => seenKeys.includes(key))) {
    return [];
  }
  await store.put(dedupeKey, [...seenKeys, ...keys].slice(-MAX_SEEN_EVENTS));
  return [body];
}

function headerValue({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | undefined {
  const match = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);
  return match ? match[1] : undefined;
}

function isValidSignature({ secret, signature, rawBody }: { secret: string; signature: string; rawBody: unknown }): boolean {
  const raw = Buffer.isBuffer(rawBody) ? rawBody : typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : undefined;
  if (!raw) {
    return false;
  }
  const expected = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'), 'utf8');
  const received = Buffer.from(signature.trim().toLowerCase(), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

class JoggAiError extends Error {
  readonly code: number;
  readonly responseBody: unknown;
  constructor({
    message,
    code,
    responseBody,
  }: {
    message: string;
    code: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'JoggAiError';
    this.code = code;
    this.responseBody = responseBody;
  }
}

type JoggAiRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  op: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
};

type JoggAiEnvelope = {
  code: number;
  msg: string;
  data?: unknown;
  [key: string]: unknown;
};

export const joggAiClient = {
  baseUrl: BASE_URL,
  request,
  requestEnvelope,
  toIntegerId,
  listOf,
  records,
  pageParams,
  compact,
  isRecord,
};

export const joggAiWebhooks = {
  registerWebhook,
  unregisterWebhook,
  acceptEvent,
};

export { JoggAiError };
export type { JoggAiEnvelope, JoggAiRequest };
