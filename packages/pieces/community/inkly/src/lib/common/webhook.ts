import { Store } from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'crypto';
import { inklyClient, InklyDocument, InklyDocumentStatus, InklyEventName, InklyRecipient } from './client';

async function enable({
  apiKey,
  webhookUrl,
  event,
  store,
}: {
  apiKey: string;
  webhookUrl: string;
  event: InklyEventName;
  store: Store;
}): Promise<void> {
  if (!webhookUrl.startsWith('https://')) {
    throw new Error(
      'Inkly delivers events only to public https:// addresses. Make sure your Activepieces instance is reachable over HTTPS, then turn the flow on again.',
    );
  }
  await removeStoredSubscription({ apiKey, store });
  const subscription = await inklyClient.createWebhookSubscription({ apiKey, url: webhookUrl, event });
  const stored: StoredSubscription = { id: subscription.id, secret: subscription.secret };
  await store.put(STORE_KEY, stored);
}

async function disable({ apiKey, store }: { apiKey: string; store: Store }): Promise<void> {
  await removeStoredSubscription({ apiKey, store });
}

async function removeStoredSubscription({ apiKey, store }: { apiKey: string; store: Store }): Promise<void> {
  const stored = readStored(await store.get<unknown>(STORE_KEY));
  if (stored) {
    await inklyClient.deleteWebhookSubscription({ apiKey, subscriptionId: stored.id });
  }
  await store.delete(STORE_KEY);
}

async function receive({
  apiKey,
  event,
  store,
  payload,
}: {
  apiKey: string;
  event: InklyEventName;
  store: Store;
  payload: { body: unknown; rawBody?: unknown; headers: Record<string, string> };
}): Promise<ReceivedEvent | null> {
  const stored = readStored(await store.get<unknown>(STORE_KEY));
  if (stored && !verifySignature({ secret: stored.secret, headers: payload.headers, rawBody: payload.rawBody })) {
    return null;
  }
  const body = readEventBody(payload.body);
  if (!body || body.type !== event) {
    return null;
  }
  const item = await inklyClient.findDocument({ apiKey, documentId: body.documentId });
  if (!item || !confirms({ event, item, recipientId: body.recipientId })) {
    return null;
  }
  return { eventId: body.id, item, signer: signerFor({ item, recipientId: body.recipientId }) };
}

async function samples({ apiKey, event }: { apiKey: string; event: InklyEventName }): Promise<ReceivedEvent[]> {
  const listed = await inklyClient.listDocuments({ apiKey, status: SAMPLE_STATUS[event], limit: 10 });
  const candidates = listed
    .filter((item) => event !== 'recipient.signed' || item.recipients.some((recipient) => recipient.status === 'signed'))
    .slice(0, 3);
  const documents = await Promise.all(
    candidates.map((candidate) => inklyClient.getDocument({ apiKey, documentId: candidate.id })),
  );
  return documents.map((item) => {
    const signer = event === 'recipient.signed' ? latestSigner(item) : undefined;
    return { eventId: SAMPLE_EVENT_ID, item, signer };
  });
}

function verifySignature({
  secret,
  headers,
  rawBody,
}: {
  secret: string;
  headers: Record<string, string>;
  rawBody: unknown;
}): boolean {
  const id = header({ headers, name: 'webhook-id' });
  const timestamp = header({ headers, name: 'webhook-timestamp' });
  const signatures = header({ headers, name: 'webhook-signature' });
  const signed = typeof rawBody === 'string' || Buffer.isBuffer(rawBody) ? rawBody : undefined;
  if (!id || !timestamp || !signatures || signed === undefined) {
    return false;
  }
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(signed).digest();
  return signatures.split(' ').some((entry) => {
    const [version, signature] = entry.split(',');
    if (version !== 'v1' || !signature) {
      return false;
    }
    const given = Buffer.from(signature, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

function header({ headers, name }: { headers: Record<string, string>; name: string }): string | undefined {
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return match === undefined ? undefined : headers[match];
}

function readStored(value: unknown): StoredSubscription | null {
  if (!inklyClient.isRecord(value)) {
    return null;
  }
  const { id, secret } = value;
  return typeof id === 'string' && typeof secret === 'string' ? { id, secret } : null;
}

function readEventBody(body: unknown): EventBody | null {
  if (!inklyClient.isRecord(body) || !inklyClient.isRecord(body['document'])) {
    return null;
  }
  const { id, type } = body;
  const documentId = body['document']['id'];
  const recipient = body['recipient'];
  const recipientId = inklyClient.isRecord(recipient) && typeof recipient['id'] === 'string' ? recipient['id'] : null;
  if (typeof id !== 'string' || typeof type !== 'string' || typeof documentId !== 'string') {
    return null;
  }
  return { id, type, documentId, recipientId };
}

function confirms({
  event,
  item,
  recipientId,
}: {
  event: InklyEventName;
  item: InklyDocument;
  recipientId: string | null;
}): boolean {
  if (event === 'document.completed') {
    return item.status === 'completed';
  }
  if (event === 'document.sent') {
    return item.status !== 'draft';
  }
  return signerFor({ item, recipientId }) !== undefined;
}

function signerFor({ item, recipientId }: { item: InklyDocument; recipientId: string | null }): InklyRecipient | undefined {
  if (!recipientId) {
    return undefined;
  }
  return item.recipients.find((recipient) => recipient.id === recipientId && recipient.status === 'signed');
}

function latestSigner(item: InklyDocument): InklyRecipient | undefined {
  return item.recipients
    .filter((recipient) => recipient.status === 'signed')
    .sort((a, b) => (b.signed_at ?? '').localeCompare(a.signed_at ?? ''))[0];
}

const STORE_KEY = 'inkly_webhook_subscription';
const SAMPLE_EVENT_ID = 'sample';
const SAMPLE_STATUS: Record<InklyEventName, InklyDocumentStatus | undefined> = {
  'document.sent': 'sent',
  'recipient.signed': undefined,
  'document.completed': 'completed',
};

export const inklyWebhook = {
  enable,
  disable,
  receive,
  samples,
  verifySignature,
};

type StoredSubscription = { id: string; secret: string };

type EventBody = { id: string; type: string; documentId: string; recipientId: string | null };

export type ReceivedEvent = {
  eventId: string;
  item: InklyDocument;
  signer?: InklyRecipient;
};
