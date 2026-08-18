import { Store } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  rawBodyToString,
  tokportalApiCall,
  TokPortalWebhookEnvelope,
  verifyTokPortalSignature,
} from '../common/client';

type WebhookPayload = {
  body: unknown;
  rawBody?: unknown;
  headers: Record<string, string>;
};

type StoredWebhook = {
  id: string;
  signingSecret: string;
  events: string[];
};

type WebhookCreateResponse = {
  data: {
    id: string;
    signing_secret: string;
  };
};

export async function registerTokPortalWebhook({
  apiKey,
  store,
  storeKey,
  webhookUrl,
  events,
  description,
}: {
  apiKey: string;
  store: Store;
  storeKey: string;
  webhookUrl: string;
  events: string[];
  description: string;
}): Promise<void> {
  const response = await tokportalApiCall<WebhookCreateResponse>({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: '/webhooks',
    body: {
      url: webhookUrl,
      events,
      description: description.slice(0, 500),
      enabled: true,
    },
  });
  const endpoint = response.data;
  if (!endpoint?.id || !endpoint?.signing_secret) {
    throw new Error('TokPortal webhook endpoint creation did not return an ID and signing secret.');
  }
  await store.put<StoredWebhook>(storeKey, {
    id: endpoint.id,
    signingSecret: endpoint.signing_secret,
    events,
  });
}

export async function unregisterTokPortalWebhook({
  apiKey,
  store,
  storeKey,
}: {
  apiKey: string;
  store: Store;
  storeKey: string;
}): Promise<void> {
  const stored = await store.get<StoredWebhook>(storeKey);
  if (stored?.id) {
    try {
      await tokportalApiCall({
        apiKey,
        method: HttpMethod.DELETE,
        resourceUri: `/webhooks/${stored.id}`,
      });
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }
  await store.delete(storeKey);
}

export async function handleTokPortalWebhook({
  store,
  storeKey,
  payload,
  allowedEvents,
}: {
  store: Store;
  storeKey: string;
  payload: WebhookPayload;
  allowedEvents?: string[];
}): Promise<TokPortalWebhookEnvelope[]> {
  const stored = await store.get<StoredWebhook>(storeKey);
  const rawBody = rawBodyToString(payload.rawBody, payload.body);
  const signatureHeader = payload.headers['tokportal-signature'] ?? payload.headers['TokPortal-Signature'];
  const valid = verifyTokPortalSignature({
    rawBody,
    signatureHeader,
    secret: stored?.signingSecret,
  });
  if (!valid) {
    return [];
  }
  const envelope = payload.body;
  if (!isEnvelope(envelope)) {
    return [];
  }
  const events = allowedEvents ?? stored?.events;
  if (events && events.length > 0 && !events.includes(envelope.type)) {
    return [];
  }
  return [envelope];
}

function isEnvelope(value: unknown): value is TokPortalWebhookEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return 'type' in value && typeof value.type === 'string' && 'data' in value;
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return false;
  }
  return response.status === 404;
}
