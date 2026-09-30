import { Store } from '@activepieces/pieces-framework';
import { randomBytes } from 'crypto';
import { apiErrorStatus, systemeIoCommon } from './client';

async function enable({
  auth,
  webhookUrl,
  store,
  event,
  prefix,
}: {
  auth: { secret_text: string };
  webhookUrl: string;
  store: Store;
  event: SystemeWebhookEvent;
  prefix: string;
}) {
  const k = storeKeys({ prefix });
  const apiKey = auth.secret_text;
  const secret = randomBytes(32).toString('hex');
  const response = await createWebhook({ apiKey, webhookUrl, event, secret });
  try {
    await store.put(k.id, response.id);
    await store.put(k.secret, secret);
  } catch (error) {
    await systemeIoCommon.deleteWebhook({ webhookId: response.id, auth: apiKey }).catch(() => undefined);
    await store.delete(k.id).catch(() => undefined);
    await store.delete(k.secret).catch(() => undefined);
    throw error;
  }
}

async function disable({ auth, store, prefix }: { auth: { secret_text: string }; store: Store; prefix: string }) {
  const k = storeKeys({ prefix });
  const webhookId = await store.get<string>(k.id);
  if (!webhookId) {
    return;
  }
  try {
    await systemeIoCommon.deleteWebhook({ webhookId, auth: auth.secret_text });
  } catch (error) {
    if (apiErrorStatus(error) !== 404) {
      throw error;
    }
  }
  await store.put(k.id, null);
  await store.put(k.secret, null);
  await store.put(k.seen, null);
}

async function accept({
  store,
  payload,
  prefix,
}: {
  store: Store;
  payload: WebhookPayload;
  prefix: string;
}): Promise<boolean> {
  const k = storeKeys({ prefix });
  const secret = await store.get<string>(k.secret);
  const signature = header({ headers: payload.headers, name: 'x-webhook-signature' });
  const messageId = header({ headers: payload.headers, name: 'x-webhook-message-id' });
  const verified = systemeIoCommon.verifyWebhookSignature({
    secret: secret ?? undefined,
    signatureHeader: signature,
    rawBody: payload.rawBody,
  });
  if (!verified) {
    const reason = !secret
      ? 'no webhook secret is stored for this trigger (re-publish the flow to recreate the webhook)'
      : !signature
        ? 'the X-Webhook-Signature header is missing'
        : payload.rawBody === undefined || payload.rawBody === null
          ? 'the raw request body is not available'
          : 'the HMAC-SHA256 signature does not match';
    throw new Error(
      `Systeme.io webhook rejected: ${reason}${messageId ? ` (message id ${messageId})` : ''}. The event was not processed.`,
    );
  }
  if (!messageId) {
    return true;
  }
  const seen = (await store.get<string[]>(k.seen)) ?? [];
  if (seen.includes(messageId)) {
    return false;
  }
  await store.put(k.seen, [...seen, messageId].slice(-SEEN_LIMIT));
  return true;
}

function normalizeTagPayload(body: unknown): unknown {
  const payload = objectOrUndefined(body);
  if (!payload) {
    return body;
  }
  const outer = objectOrUndefined(payload['contact']);
  const inner = outer ? objectOrUndefined(outer['contact']) : undefined;
  return { ...payload, contact: inner ?? outer ?? null, tag: payload['tag'] ?? null };
}

function tagIdOf(body: unknown): number | undefined {
  const tag = objectOrUndefined(objectOrUndefined(body)?.['tag']);
  const id = Number(tag?.['id']);
  return Number.isInteger(id) ? id : undefined;
}

function tagEvent({ body, tagFilter }: { body: unknown; tagFilter: unknown }): unknown[] {
  const filtered = tagFilter !== undefined && tagFilter !== null && String(tagFilter) !== '';
  if (filtered && tagIdOf(body) !== Number(tagFilter)) {
    return [];
  }
  return [normalizeTagPayload(body)];
}

function unwrap({ body, key }: { body: unknown; key: string }): unknown {
  const inner = isRecord(body) ? body[key] : undefined;
  return inner ? inner : body;
}

export const systemeWebhook = { enable, disable, accept, tagEvent, unwrap };

const SEEN_LIMIT = 200;

function storeKeys({ prefix }: { prefix: string }) {
  return {
    id: `${prefix}_webhook_id`,
    secret: `${prefix}_webhook_secret`,
    seen: `${prefix}_seen_message_ids`,
  };
}

function header({ headers, name }: { headers: WebhookPayload['headers']; name: string }): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function isAlreadyUsed(error: unknown): boolean {
  return (
    apiErrorStatus(error) === 422 &&
    error instanceof Error &&
    /\b(name|url): This value is already used/.test(error.message)
  );
}

async function createWebhook({
  apiKey,
  webhookUrl,
  event,
  secret,
}: {
  apiKey: string;
  webhookUrl: string;
  event: SystemeWebhookEvent;
  secret: string;
}) {
  const create = () => systemeIoCommon.createWebhook({ eventType: event, webhookUrl, auth: apiKey, secret });
  try {
    return await create();
  } catch (error) {
    if (!isAlreadyUsed(error)) {
      throw error;
    }
    const name = systemeIoCommon.webhookName({ eventType: event, webhookUrl });
    const stale = (await systemeIoCommon.listWebhooks({ auth: apiKey })).filter(
      (webhook) => webhook.url === webhookUrl || webhook.name === name,
    );
    if (stale.length === 0) {
      throw error;
    }
    for (const webhook of stale) {
      await systemeIoCommon.deleteWebhook({ webhookId: webhook.id, auth: apiKey }).catch((deleteError: unknown) => {
        if (apiErrorStatus(deleteError) !== 404) {
          throw deleteError;
        }
      });
    }
    return create();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

type SystemeWebhookEvent =
  | 'CONTACT_CREATED'
  | 'CONTACT_TAG_ADDED'
  | 'CONTACT_TAG_REMOVED'
  | 'CONTACT_OPT_IN'
  | 'SALE_NEW'
  | 'SALE_CANCELED';

type WebhookPayload = {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  rawBody?: unknown;
};
