import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
} from '@activepieces/pieces-common';

function firstValidationErrorMessage(errors: Record<string, unknown>): string | undefined {
  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return undefined;
}

function errorDetailFromBody(body: unknown): string {
  if (body === null || body === undefined) {
    return 'Unknown error';
  }
  if (typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['error'] === 'string' && record['error'].length > 0) {
      return record['error'];
    }
    if (typeof record['message'] === 'string' && record['message'].length > 0) {
      const message = record['message'];
      const errors = record['errors'];
      if (errors && typeof errors === 'object' && errors !== null) {
        const first = firstValidationErrorMessage(errors as Record<string, unknown>);
        if (first) {
          return `${message} ${first}`;
        }
      }
      return message;
    }
  }
  return 'Unknown error';
}

function stripEmptyOptionalFields(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
        return false;
      }
      return true;
    }),
  );
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function normalizeFamulorHost(input?: string): string {
  const raw = (input ?? DEFAULT_FAMULOR_HOST).trim() || DEFAULT_FAMULOR_HOST;
  let host = raw.replace(/\/+$/, '');
  host = host.replace(/\/api\/v1$/i, '');
  if (!/^https?:\/\//i.test(host)) {
    host = `https://${host}`;
  }
  return host.replace(/\/+$/, '');
}

export function assertNotClassicHost(host: string): void {
  if (/famulor\.de/i.test(host)) {
    throw new Error(
      'app.famulor.de is Famulor Classic 1.0 and has no /api/v1. Use https://app.famulor.io or a verified whitelabel domain.',
    );
  }
}

export function resolveFamulorAuth(auth: unknown): FamulorCredentials {
  if (!auth || typeof auth !== 'object') {
    throw new Error('Connect your Famulor account first.');
  }

  const record = auth as Record<string, unknown>;
  const props =
    record['props'] && typeof record['props'] === 'object'
      ? (record['props'] as Record<string, unknown>)
      : record;

  const apiKey = readString(props, 'apiKey');
  if (!apiKey) {
    throw new Error('API key is required.');
  }

  const host = normalizeFamulorHost(readString(props, 'baseUrl'));
  assertNotClassicHost(host);

  return {
    apiKey,
    host,
    apiBaseUrl: `${host}/api/v1`,
  };
}

export async function famulorRequest<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const credentials = resolveFamulorAuth(auth);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${credentials.apiBaseUrl}${normalizedPath}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: credentials.apiKey,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    queryParams,
    body: body === undefined ? undefined : stripEmptyOptionalFields(body as Record<string, unknown>),
  });

  if (response.status >= 200 && response.status < 300) {
    return response.body;
  }

  throw new Error(
    `Famulor API ${method} ${normalizedPath} failed (${response.status}): ${errorDetailFromBody(response.body)}`,
  );
}

export function unwrapList(body: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter((item): item is Record<string, unknown> => {
      return item !== null && typeof item === 'object' && !Array.isArray(item);
    });
  }
  if (!body || typeof body !== 'object') {
    return [];
  }
  const record = body as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => {
        return item !== null && typeof item === 'object' && !Array.isArray(item);
      });
    }
  }
  return [];
}

export function unwrapTotal(body: unknown): number | null {
  if (body && typeof body === 'object' && typeof (body as { total?: unknown }).total === 'number') {
    return (body as { total: number }).total;
  }
  return null;
}

export function unwrapEntity(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }
  const record = body as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return record;
}

export function asScalar(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value);
}

export function formatTranscript(transcript: unknown): string | null {
  if (transcript === undefined || transcript === null) {
    return null;
  }
  if (typeof transcript === 'string') {
    return transcript;
  }
  if (Array.isArray(transcript)) {
    const lines = transcript
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const record = item as Record<string, unknown>;
        const role = typeof record['role'] === 'string' ? record['role'] : 'unknown';
        const content = record['content'];
        const text = Array.isArray(content)
          ? content.map((part) => String(part)).join(' ')
          : typeof content === 'string'
            ? content
            : typeof record['text'] === 'string'
              ? record['text']
              : '';
        if (!text) {
          return null;
        }
        return `${role}: ${text}`;
      })
      .filter((line): line is string => line !== null);
    return lines.length > 0 ? lines.join('\n') : null;
  }
  if (typeof transcript === 'object') {
    const items = (transcript as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return formatTranscript(items);
    }
  }
  return JSON.stringify(transcript);
}

export function flattenCall(body: unknown): Record<string, unknown> {
  const call = unwrapEntity(body, ['call', 'data']);
  const analysis =
    call['analysis'] && typeof call['analysis'] === 'object'
      ? (call['analysis'] as Record<string, unknown>)
      : {};

  return {
    id: asScalar(call['id']),
    assistant_id: asScalar(call['assistant_id']),
    campaign_id: asScalar(call['campaign_id']),
    phone_number_id: asScalar(call['phone_number_id']),
    lead_id: asScalar(call['lead_id']),
    direction: asScalar(call['direction']),
    from_number: asScalar(call['from_number']),
    to_number: asScalar(call['to_number']),
    status: asScalar(call['status']),
    started_at: asScalar(call['started_at']),
    answered_at: asScalar(call['answered_at']),
    ended_at: asScalar(call['ended_at']),
    duration_sec: asScalar(call['duration_sec']),
    summary: asScalar(call['summary']),
    sentiment: asScalar(call['sentiment'] ?? analysis['sentiment']),
    success: asScalar(call['success'] ?? analysis['success']),
    recording_url: asScalar(call['recording_url']),
    transcript: formatTranscript(call['transcript']),
    created_at: asScalar(call['created_at']),
    updated_at: asScalar(call['updated_at']),
    queued: typeof (body as { queued?: unknown } | null)?.['queued'] === 'boolean'
      ? (body as { queued: boolean }).queued
      : null,
  };
}

export function flattenAssistant(body: unknown): Record<string, unknown> {
  const assistant = unwrapEntity(body, ['assistant', 'data']);
  const tags = assistant['tags'];
  return {
    id: asScalar(assistant['id']),
    name: asScalar(assistant['name']),
    is_active: asScalar(assistant['is_active']),
    mode: asScalar(assistant['mode']),
    primary_language: asScalar(assistant['primary_language']),
    timezone: asScalar(assistant['timezone']),
    first_message: asScalar(assistant['first_message']),
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag)).join(', ') : null,
    created_at: asScalar(assistant['created_at']),
    updated_at: asScalar(assistant['updated_at']),
  };
}

export function flattenCampaign(body: unknown): Record<string, unknown> {
  const campaign = unwrapEntity(body, ['campaign', 'data']);
  return {
    id: asScalar(campaign['id']),
    name: asScalar(campaign['name']),
    status: asScalar(campaign['status']),
    channel: asScalar(campaign['channel']),
    assistant_id: asScalar(campaign['assistant_id']),
    timezone: asScalar(campaign['timezone']),
    concurrency: asScalar(campaign['concurrency']),
    retry_max: asScalar(campaign['retry_max']),
    retry_delay_minutes: asScalar(campaign['retry_delay_minutes']),
    mark_complete_when_no_leads: asScalar(campaign['mark_complete_when_no_leads']),
    scheduled_start_at: asScalar(campaign['scheduled_start_at']),
    created_at: asScalar(campaign['created_at']),
    updated_at: asScalar(campaign['updated_at']),
  };
}

export function flattenWebhookCall(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {
      event: CALL_COMPLETED_EVENT,
      id: null,
    };
  }
  const record = payload as Record<string, unknown>;
  const event =
    typeof record['event'] === 'string'
      ? record['event']
      : typeof record['type'] === 'string'
        ? record['type']
        : CALL_COMPLETED_EVENT;
  const nested =
    (record['data'] && typeof record['data'] === 'object' && !Array.isArray(record['data'])
      ? (record['data'] as Record<string, unknown>)
      : null) ??
    (record['call'] && typeof record['call'] === 'object' && !Array.isArray(record['call'])
      ? (record['call'] as Record<string, unknown>)
      : record);

  return {
    event,
    ...flattenCall(nested),
  };
}

export const DEFAULT_FAMULOR_HOST = 'https://app.famulor.io';
export const CALL_COMPLETED_EVENT = 'call.completed';

export type FamulorCredentials = {
  apiKey: string;
  host: string;
  apiBaseUrl: string;
};
