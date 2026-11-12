import { HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import crypto from 'crypto';
import { genayaApi, GenayaApiError } from './client';
import { genayaOutput } from './mappers';
import { GenayaWebhookEndpoint, GenayaWebhookEvent } from './types';

// Genaya webhooks follow the REST-hook pattern: turning the flow on creates a
// webhook endpoint for one event type, turning it off deletes it. Every
// delivery is signed: X-Genaya-Signature is "t=<unix>,v1=<hex>", where v1 is
// the HMAC-SHA256 of "<t>.<raw body>" keyed with the endpoint secret that is
// returned only when the endpoint is created.

async function subscribe({
  apiKey,
  webhookUrl,
  event,
  store,
}: {
  apiKey: string;
  webhookUrl: string;
  event: string;
  store: Store;
}): Promise<void> {
  const response = await genayaApi.request<{ data?: GenayaWebhookEndpoint }>({
    apiKey,
    method: HttpMethod.POST,
    path: '/webhook-endpoints',
    body: { url: webhookUrl, events: [event], description: 'Activepieces' },
  });
  const endpoint = response.data;
  if (!endpoint?.id) {
    throw new Error('Genaya did not return the new webhook endpoint. Turn the flow on again.');
  }
  if (!endpoint.secret || endpoint.secret.includes('...')) {
    await deleteEndpoint({ apiKey, endpointId: endpoint.id });
    throw new Error('Genaya did not return the webhook signing secret, so deliveries could not be verified. Turn the flow on again.');
  }
  await store.put<StoredEndpoint>(ENDPOINT_KEY, { endpointId: endpoint.id, secret: endpoint.secret });
}

async function unsubscribe({ apiKey, store }: { apiKey: string; store: Store }): Promise<void> {
  const stored = await store.get<StoredEndpoint>(ENDPOINT_KEY);
  if (stored?.endpointId) {
    await deleteEndpoint({ apiKey, endpointId: stored.endpointId });
  }
  await store.delete(ENDPOINT_KEY);
  await store.delete(SEEN_KEY);
}

// A 404 means the endpoint is already gone (deleted by hand in Genaya under
// Settings > Developer > Webhooks), which is the state we want.
async function deleteEndpoint({ apiKey, endpointId }: { apiKey: string; endpointId: string }): Promise<void> {
  try {
    await genayaApi.request({
      apiKey,
      method: HttpMethod.DELETE,
      path: `/webhook-endpoints/${encodeURIComponent(endpointId)}`,
    });
  } catch (error) {
    if (error instanceof GenayaApiError && (error.status === 404 || error.status === 410)) {
      return;
    }
    throw error;
  }
}

async function handle({
  payload,
  store,
  event,
  accept,
}: {
  payload: WebhookPayload;
  store: Store;
  event: string;
  accept?: (record: Record<string, unknown>) => boolean;
}): Promise<Record<string, unknown>[]> {
  const stored = await store.get<StoredEndpoint>(ENDPOINT_KEY);
  const problem = signatureProblem({
    secret: stored?.secret,
    signatureHeader: headerOf({ headers: payload.headers, name: SIGNATURE_HEADER }),
    rawBody: rawBodyOf(payload),
    nowMs: Date.now(),
  });
  if (problem !== undefined) {
    console.warn(`[genaya] Dropped a webhook delivery because ${problem}.`);
    return [];
  }
  const delivery = eventOf(payload.body);
  // The Genaya "Send test event" button delivers a ping; only the subscribed
  // event type starts the flow.
  if (delivery === undefined || delivery.type !== event) {
    return [];
  }
  const record = delivery.data?.object;
  if (accept && !(genayaApi.isRecord(record) && accept(record))) {
    return [];
  }
  // Delivery is at-least-once, so the same event id can arrive twice.
  if (delivery.id) {
    const seen = (await store.get<string[]>(SEEN_KEY)) ?? [];
    if (seen.includes(delivery.id)) {
      return [];
    }
    await store.put<string[]>(SEEN_KEY, [delivery.id, ...seen].slice(0, SEEN_LIMIT));
  }
  return [genayaOutput.event(delivery)];
}

function eventOf(body: unknown): GenayaWebhookEvent | undefined {
  if (!genayaApi.isRecord(body)) {
    return undefined;
  }
  const data = body['data'];
  return {
    id: textOf(body['id']),
    object: textOf(body['object']),
    type: textOf(body['type']),
    created: textOf(body['created']),
    organization_id: textOf(body['organization_id']),
    data: genayaApi.isRecord(data) ? { object: data['object'] } : undefined,
  };
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function signatureProblem({
  secret,
  signatureHeader,
  rawBody,
  nowMs,
}: {
  secret: string | undefined;
  signatureHeader: string | undefined;
  rawBody: string | undefined;
  nowMs: number;
}): string | undefined {
  if (!secret) {
    return 'no webhook secret is stored for this flow';
  }
  if (!signatureHeader) {
    return 'the X-Genaya-Signature header is missing';
  }
  if (rawBody === undefined) {
    return 'the request body is not available';
  }
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = valueOf({ parts, key: 't' });
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) {
    return 'the X-Genaya-Signature header is malformed';
  }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  if (!signatures.some((signature) => matches({ expected, signature }))) {
    return 'the signature does not match';
  }
  if (Math.abs(nowMs / 1000 - Number(timestamp)) > TIMESTAMP_TOLERANCE_SECONDS) {
    return `it was signed more than ${TIMESTAMP_TOLERANCE_SECONDS / 60} minutes ago`;
  }
  return undefined;
}

function matches({ expected, signature }: { expected: Buffer; signature: string }): boolean {
  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    return false;
  }
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function valueOf({ parts, key }: { parts: string[]; key: string }): string | undefined {
  const part = parts.find((entry) => entry.startsWith(`${key}=`));
  return part === undefined ? undefined : part.slice(key.length + 1);
}

function headerOf({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | undefined {
  if (!headers) {
    return undefined;
  }
  const key = Object.keys(headers).find((header) => header.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
}

function rawBodyOf(payload: WebhookPayload): string | undefined {
  if (typeof payload.rawBody === 'string') {
    return payload.rawBody;
  }
  if (Buffer.isBuffer(payload.rawBody)) {
    return payload.rawBody.toString('utf8');
  }
  // Genaya sends the body as compact JSON, so re-serializing the parsed body
  // reproduces it when the raw bytes were not kept.
  return payload.body === undefined ? undefined : JSON.stringify(payload.body);
}

const ENDPOINT_KEY = 'genaya_webhook_endpoint';
const SEEN_KEY = 'genaya_webhook_seen_event_ids';
const SEEN_LIMIT = 100;
const SIGNATURE_HEADER = 'x-genaya-signature';
const TIMESTAMP_TOLERANCE_SECONDS = 900;

export const genayaWebhook = {
  subscribe,
  unsubscribe,
  handle,
};

type StoredEndpoint = {
  endpointId: string;
  secret: string;
};

type WebhookPayload = {
  body: unknown;
  rawBody?: unknown;
  headers: Record<string, string>;
};
