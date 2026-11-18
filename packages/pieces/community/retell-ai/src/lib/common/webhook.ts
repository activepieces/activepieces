import { createHmac, timingSafeEqual } from 'crypto';
import { DEDUPE_KEY_PROPERTY, Property } from '@activepieces/pieces-framework';
import { isRecord } from './client';

export function verifyRetellSignature({
  apiKey,
  rawBody,
  headers,
  nowMs,
}: {
  apiKey: string;
  rawBody: unknown;
  headers: Record<string, string | undefined> | undefined;
  nowMs: number;
}): boolean {
  const raw = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : undefined;
  if (raw === undefined) {
    return false;
  }
  const header = headerValue({ headers, name: 'x-retell-signature' });
  if (header === undefined) {
    return false;
  }
  const match = /^v=(\d+),d=([0-9a-fA-F]+)$/.exec(header.trim());
  if (match === null) {
    return false;
  }
  const timestamp = Number(match[1]);
  if (nowMs - timestamp > REPLAY_WINDOW_MS || timestamp - nowMs > CLOCK_SKEW_MS) {
    return false;
  }
  const expected = createHmac('sha256', apiKey.trim()).update(raw + match[1]).digest('hex');
  const received = Buffer.from(match[2].toLowerCase(), 'utf8');
  const digest = Buffer.from(expected, 'utf8');
  return received.length === digest.length && timingSafeEqual(received, digest);
}

export async function handleRetellWebhook({
  apiKey,
  payload,
  store,
  event,
  nowMs,
}: {
  apiKey: string;
  payload: { body: unknown; rawBody?: unknown; headers: Record<string, string | undefined> };
  store: { get<T>(key: string): Promise<T | null>; put<T>(key: string, value: T): Promise<T> };
  event: RetellCallEvent;
  nowMs: number;
}): Promise<unknown[]> {
  if (!verifyRetellSignature({ apiKey, rawBody: payload.rawBody, headers: payload.headers, nowMs })) {
    return [];
  }
  const body = parseBody(payload.body);
  if (body === undefined || body['event'] !== event || !isRecord(body['call'])) {
    return [];
  }
  const callId = body['call']['call_id'];
  if (typeof callId !== 'string' || callId.length === 0) {
    return [];
  }
  const deliveryKey = `${event}:${callId}`;
  const storeKey = `retell_${event}_deliveries`;
  const seen = (await store.get<string[]>(storeKey)) ?? [];
  if (seen.includes(deliveryKey)) {
    return [];
  }
  await store.put(storeKey, [...seen, deliveryKey].slice(-MAX_REMEMBERED_DELIVERIES));
  return [{ event, call: body['call'], [DEDUPE_KEY_PROPERTY]: deliveryKey }];
}

export function webhookInstructions(eventName: RetellCallEvent) {
  return Property.MarkDown({
    value: `Retell sends call events to one account-level webhook URL. To use this trigger:

1. In the Retell AI dashboard, open **Settings > Webhooks**.
2. Set the account webhook URL to:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Save. Retell sends **call_started**, **call_ended** and **call_analyzed** to that URL; this trigger only reacts to **${eventName}**.
4. The connection must use the API key with the **webhook** badge (Settings > API Keys). Deliveries whose X-Retell-Signature does not match that key are ignored.

An agent with its own webhook URL sends its events there instead of to the account URL. Nothing is registered or removed automatically when this flow is turned on or off.`,
  });
}

function headerValue({ headers, name }: { headers: Record<string, string | undefined> | undefined; name: string }): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (isRecord(body)) {
    return body;
  }
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      const parsed: unknown = JSON.parse(body.toString());
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const MAX_REMEMBERED_DELIVERIES = 500;
const REPLAY_WINDOW_MS = 15 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export type RetellCallEvent = 'call_started' | 'call_ended' | 'call_analyzed';
