import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const MAILFLOSS_API_URL = 'https://api.mailfloss.com';

async function send<T>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${MAILFLOSS_API_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    queryParams,
    body,
  });
  return response.body;
}

async function createWebhook({
  apiKey,
  url,
  name,
  event,
}: {
  apiKey: string;
  url: string;
  name: string;
  event: WebhookEvent;
}): Promise<string> {
  try {
    const webhook = await send<{ id: string }>({
      apiKey,
      method: HttpMethod.POST,
      path: '/v1/webhooks',
      body: { name, url, events: [event] },
    });
    return webhook.id;
  } catch (e) {
    if (e instanceof HttpError && e.response.status === 403) {
      throw new Error(
        'mailfloss refused to create the webhook. Check that your mailfloss plan includes Webhooks and that this API key can manage them.'
      );
    }
    throw e;
  }
}

async function deleteWebhook({
  apiKey,
  id,
}: {
  apiKey: string;
  id: string;
}): Promise<void> {
  try {
    await send({
      apiKey,
      method: HttpMethod.DELETE,
      path: `/v1/webhooks/${encodeURIComponent(id)}`,
    });
  } catch (e) {
    // Already gone, e.g. deleted on the mailfloss dashboard.
    if (e instanceof HttpError && e.response.status === 404) {
      return;
    }
    throw e;
  }
}

export const mailflossApi = { send, createWebhook, deleteWebhook };

export type WebhookEvent = 'job-finished' | 'status-undeliverable';
