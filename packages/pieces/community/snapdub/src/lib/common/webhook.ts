import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { SNAPDUB_BASE_URL, snapdubClient } from './client';

async function subscribe({
  apiKey,
  webhookUrl,
  event,
}: {
  apiKey: string;
  webhookUrl: string;
  event: SnapDubEvent;
}): Promise<StoredWebhook> {
  const response = await snapdubClient.call<{
    webhook_id: string;
    secret?: string;
  }>({
    apiKey,
    method: HttpMethod.POST,
    path: '/webhooks',
    body: { url: webhookUrl, events: [event] },
  });
  if (!response.secret) {
    throw new Error(
      'SnapDub did not return a signing secret for the webhook, so deliveries could not be verified.'
    );
  }
  return { webhookId: response.webhook_id, secret: response.secret };
}

async function unsubscribe({
  apiKey,
  webhookId,
}: {
  apiKey: string;
  webhookId: string;
}): Promise<void> {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${SNAPDUB_BASE_URL}/webhooks/${encodeURIComponent(webhookId)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    });
  } catch (error) {
    if (
      error instanceof HttpError &&
      GONE_STATUSES.includes(error.response.status)
    ) {
      return;
    }
    throw new Error(snapdubClient.errorMessage({ error }));
  }
}

// Only signed deliveries start a flow: with no stored secret (the trigger was never enabled, e.g.
// someone calling the draft webhook URL) there is nothing to check against, so nothing passes.
// SnapDub resends a delivery with the same id when a reply is lost, so ids already accepted are
// remembered and skipped; the id is also the run's dedupe key.
async function parseDelivery({
  payload,
  event,
  secret,
  store,
}: {
  payload: DeliveryPayload;
  event: SnapDubEvent;
  secret: string | undefined;
  store: Store;
}): Promise<Record<string, unknown>[]> {
  if (
    !secret ||
    !snapdubClient.verifySignature({
      secret,
      header: headerValue({ headers: payload.headers, name: SIGNATURE_HEADER }),
      rawBody: payload.rawBody,
    })
  ) {
    return [];
  }
  const body = payload.body;
  if (!snapdubClient.isRecord(body) || body['event'] !== event) {
    return [];
  }
  const deliveryId = typeof body['id'] === 'string' ? body['id'] : undefined;
  if (deliveryId) {
    const seen = (await store.get<string[]>(SEEN_DELIVERIES_KEY)) ?? [];
    if (seen.includes(deliveryId)) {
      return [];
    }
    await store.put<string[]>(
      SEEN_DELIVERIES_KEY,
      [...seen, deliveryId].slice(-SEEN_DELIVERIES_LIMIT)
    );
  }
  const data = snapdubClient.isRecord(body['data']) ? body['data'] : {};
  return [
    {
      event,
      delivery_id: deliveryId,
      delivered_at: body['created_at'],
      ...data,
      ...(deliveryId ? { [DEDUPE_KEY_PROPERTY]: deliveryId } : {}),
    },
  ];
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, string>;
  name: string;
}): string | undefined {
  const match = Object.entries(headers ?? {}).find(
    ([key]) => key.toLowerCase() === name
  );
  return match?.[1];
}

const SIGNATURE_HEADER = 'x-snapdub-signature';

const GONE_STATUSES = [401, 402, 404, 422];

export const WEBHOOK_STORE_KEY = 'snapdub_webhook';

const SEEN_DELIVERIES_KEY = 'snapdub_seen_deliveries';

const SEEN_DELIVERIES_LIMIT = 200;

export const snapdubWebhook = {
  subscribe,
  unsubscribe,
  parseDelivery,
};

export type SnapDubEvent = 'video.completed' | 'video.failed';

export type StoredWebhook = {
  webhookId: string;
  secret?: string;
};

type DeliveryPayload = {
  body: unknown;
  rawBody?: unknown;
  headers: Record<string, string>;
};
