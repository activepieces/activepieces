import { HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { GhostApiError, GhostAuthValue, ghostClient, ghostCommon } from './client';

type WebhookStore = {
  put(key: string, value: StoredWebhook): Promise<unknown>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
};

type StoredWebhook = { webhookId: string; secret?: string };

const SIGNATURE_HEADER = 'x-ghost-signature';

const storedWebhookOf = (value: unknown): StoredWebhook | null => {
  if (!ghostCommon.isRecord(value) || typeof value['webhookId'] !== 'string') {
    return null;
  }
  return {
    webhookId: value['webhookId'],
    secret: typeof value['secret'] === 'string' ? value['secret'] : undefined,
  };
};

const deleteWebhook = async ({ auth, webhookId }: { auth: GhostAuthValue; webhookId: string }) => {
  try {
    await ghostClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/webhooks/${encodeURIComponent(webhookId)}`,
    });
  } catch (error) {
    if (error instanceof GhostApiError && error.status === 404) {
      return;
    }
    throw error;
  }
};

const signatureHeaderOf = (headers: unknown): string | undefined => {
  if (!ghostCommon.isRecord(headers)) {
    return undefined;
  }
  const name = Object.keys(headers).find((key) => key.toLowerCase() === SIGNATURE_HEADER);
  const value = name ? headers[name] : undefined;
  return typeof value === 'string' ? value : undefined;
};

const signatureMatches = ({
  secret,
  rawBody,
  signatureHeader,
}: {
  secret: string;
  rawBody: unknown;
  signatureHeader: string | undefined;
}): boolean => {
  if (!signatureHeader || !(typeof rawBody === 'string' || Buffer.isBuffer(rawBody))) {
    return false;
  }
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(',')) {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length > 0) {
      parts[key] = rest.join('=');
    }
  }
  const provided = parts['sha256'];
  const timestamp = parts['t'];
  if (!provided || !timestamp) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(Buffer.concat([Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody), Buffer.from(timestamp)]))
    .digest();
  const providedBytes = Buffer.from(provided, 'hex');
  return providedBytes.length === expected.length && crypto.timingSafeEqual(providedBytes, expected);
};

export const ghostWebhook = {
  async enable({
    auth,
    event,
    webhookUrl,
    store,
    storeKey,
  }: {
    auth: GhostAuthValue;
    event: string;
    webhookUrl: string;
    store: WebhookStore;
    storeKey: string;
  }): Promise<void> {
    const secret = crypto.randomBytes(32).toString('hex');
    const response = await ghostClient.request<{ webhooks?: { id?: string }[] }>({
      auth,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { webhooks: [{ event, target_url: webhookUrl, secret }] },
    });
    const webhookId = response.webhooks?.[0]?.id;
    if (!webhookId) {
      throw new Error(`Ghost did not return an ID for the ${event} webhook.`);
    }
    try {
      await store.put(storeKey, { webhookId, secret });
    } catch (error) {
      await deleteWebhook({ auth, webhookId });
      throw error;
    }
  },
  async disable({
    auth,
    store,
    storeKey,
  }: {
    auth: GhostAuthValue;
    store: WebhookStore;
    storeKey: string;
  }): Promise<void> {
    const stored = storedWebhookOf(await store.get(storeKey));
    if (!stored) {
      return;
    }
    await deleteWebhook({ auth, webhookId: stored.webhookId });
    await store.delete(storeKey);
  },
  async assertSigned({
    store,
    storeKey,
    rawBody,
    headers,
  }: {
    store: WebhookStore;
    storeKey: string;
    rawBody: unknown;
    headers: unknown;
  }): Promise<void> {
    const stored = storedWebhookOf(await store.get(storeKey));
    if (!stored?.secret) {
      return;
    }
    if (!signatureMatches({ secret: stored.secret, rawBody, signatureHeader: signatureHeaderOf(headers) })) {
      throw new Error(
        'The X-Ghost-Signature header did not match the secret this trigger registered with Ghost, so the request was not accepted.'
      );
    }
  },
};
