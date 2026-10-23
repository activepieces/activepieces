import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
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

function parseDelivery({
  payload,
  event,
  secret,
}: {
  payload: DeliveryPayload;
  event: SnapDubEvent;
  secret: string | undefined;
}): Record<string, unknown>[] {
  if (
    secret &&
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
  const data = snapdubClient.isRecord(body['data']) ? body['data'] : {};
  return [
    {
      event,
      delivery_id: body['id'],
      delivered_at: body['created_at'],
      ...data,
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
