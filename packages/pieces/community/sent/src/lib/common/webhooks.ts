import { randomUUID } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { Store, StoreScope } from '@activepieces/pieces-framework';
import { sentApi, SentApiError } from './api';
import { sentEvents } from './events';
import { EncryptedSecret, sentSecurity } from './security';
import { Webhook, WebhookList, WebhookRequest } from './types';
import { sentValues } from './values';

async function remove({
  apiKey,
  id,
  profileId,
}: {
  apiKey: string;
  id: string;
  profileId?: string;
}): Promise<void> {
  try {
    await sentApi.request({
      apiKey,
      path: `/webhooks/${encodeURIComponent(id)}`,
      method: HttpMethod.DELETE,
      profileId,
    });
  } catch (error) {
    if (!(error instanceof SentApiError && error.status === 404)) throw error;
  }
}

async function disable({ apiKey, store }: StoreInput): Promise<void> {
  const state = await store.get<WebhookState>(STORE_KEY, StoreScope.FLOW);
  if (!state) return;
  if (state.kind === 'active') {
    await remove({ apiKey, id: state.id, profileId: state.profileId });
  } else {
    const ids: string[] = [];
    for (let page = 1; ; page++) {
      const result = sentApi.data(
        await sentApi.request<WebhookList>({
          apiKey,
          path: '/webhooks',
          profileId: state.profileId,
          query: { page, page_size: 100 },
        })
      );
      ids.push(
        ...result.webhooks
          .filter(
            (webhook) =>
              webhook.display_name === state.request.display_name &&
              webhook.endpoint_url === state.request.endpoint_url
          )
          .map((webhook) => webhook.id)
      );
      if (!result.pagination?.has_more) break;
      if (page >= 1000)
        throw new Error(
          'Could not finish reconciling Sent webhooks. The subscription record was retained; retry disabling the flow.'
        );
    }
    for (const id of ids)
      await remove({ apiKey, id, profileId: state.profileId });
  }
  await store.delete(STORE_KEY, StoreScope.FLOW);
}

async function enable({
  apiKey,
  store,
  webhookUrl,
  flowId,
  profileId,
  selected,
}: EnableInput): Promise<void> {
  if (new URL(webhookUrl).protocol !== 'https:')
    throw new Error('Sent requires a publicly reachable HTTPS webhook URL.');
  const subscription = sentEvents.subscription(selected);
  let previous = await store.get<WebhookState>(STORE_KEY, StoreScope.FLOW);
  const sameConfig =
    previous &&
    previous.profileId === profileId &&
    previous.request.endpoint_url === webhookUrl &&
    JSON.stringify(subscription) ===
      JSON.stringify({
        event_types: previous.request.event_types,
        ...(previous.request.event_filters
          ? { event_filters: previous.request.event_filters }
          : {}),
      });
  if (previous?.kind === 'active' && sameConfig) {
    try {
      const existing = sentApi.data(
        await sentApi.request<Webhook>({
          apiKey,
          path: `/webhooks/${encodeURIComponent(previous.id)}`,
          profileId: previous.profileId,
        })
      );
      if (
        existing.is_active &&
        existing.endpoint_url === webhookUrl &&
        JSON.stringify(existing.event_types) ===
          JSON.stringify(previous.request.event_types) &&
        JSON.stringify(existing.event_filters ?? {}) ===
          JSON.stringify(previous.request.event_filters ?? {})
      ) {
        sentSecurity.decrypt({
          encrypted: previous.secret,
          apiKey,
          webhookId: previous.id,
        });
        return;
      }
    } catch (error) {
      if (error instanceof SentApiError && error.status !== 404) throw error;
    }
  }
  if (
    previous &&
    (previous.kind === 'active' ||
      !sameConfig ||
      Date.now() - previous.createdAt > 23 * 60 * 60 * 1000)
  ) {
    await disable({ apiKey, store });
    previous = null;
  }
  const pending: PendingWebhook =
    previous?.kind === 'pending'
      ? previous
      : {
          kind: 'pending',
          profileId,
          idempotencyKey: `ap_sent_${randomUUID()}`,
          createdAt: Date.now(),
          request: {
            ...subscription,
            display_name: `Activepieces ${flowId} ${randomUUID()}`.slice(
              0,
              255
            ),
            endpoint_url: webhookUrl,
            retry_count: 3,
            timeout_seconds: 30,
          },
        };
  await store.put(STORE_KEY, pending, StoreScope.FLOW);
  const webhook = sentApi.data(
    await sentApi.request<Webhook>({
      apiKey,
      path: '/webhooks',
      method: HttpMethod.POST,
      profileId: pending.profileId,
      idempotencyKey: pending.idempotencyKey,
      body: pending.request,
    })
  );
  if (!webhook.id)
    throw new Error(
      'Sent returned no webhook ID. Disable this flow to reconcile the pending subscription before trying again.'
    );
  try {
    if (!webhook.signing_secret)
      throw new Error('Sent did not return the webhook signing secret.');
    const state: ActiveWebhook = {
      ...pending,
      kind: 'active',
      id: webhook.id,
      secret: sentSecurity.encrypt({
        secret: webhook.signing_secret,
        apiKey,
        webhookId: webhook.id,
      }),
    };
    await store.put(STORE_KEY, state, StoreScope.FLOW);
  } catch {
    await remove({ apiKey, id: webhook.id, profileId: pending.profileId });
    await store.delete(STORE_KEY, StoreScope.FLOW);
    throw new Error(
      'Could not save the Sent webhook signing secret. The external webhook was removed; enable the flow again.'
    );
  }
}

async function run({
  apiKey,
  store,
  payload,
  selected,
}: RunInput): Promise<unknown[]> {
  const state = await store.get<WebhookState>(STORE_KEY, StoreScope.FLOW);
  if (!state || state.kind !== 'active')
    throw new Error(
      'The Sent webhook is not registered. Enable the flow before receiving events.'
    );
  const secret = sentSecurity.decrypt({
    apiKey,
    encrypted: state.secret,
    webhookId: state.id,
  });
  if (
    !sentSecurity.verify({
      secret,
      webhookId: state.id,
      headers: payload.headers,
      rawBody: payload.rawBody,
    })
  ) {
    throw new Error(
      'Sent webhook signature verification failed: missing or invalid signature, raw body, webhook ID, or timestamp.'
    );
  }
  const raw = payload.rawBody;
  const body: unknown = JSON.parse(
    Buffer.isBuffer(raw)
      ? raw.toString('utf8')
      : typeof raw === 'string'
      ? raw
      : 'null'
  );
  if (!sentEvents.matches({ body, selected })) return [];
  const eventHeader = sentSecurity.header({
    headers: payload.headers,
    name: 'X-Webhook-Event-Type',
  });
  if (
    !sentValues.isRecord(body) ||
    !eventHeader ||
    eventHeader !== (body['event'] ?? body['field'])
  )
    throw new Error(
      'Sent webhook event header does not match the signed event body.'
    );
  return [body];
}

export const sentWebhooks = { enable, disable, run };
export const STORE_KEY = 'sent_webhook';
export type StoreInput = { apiKey: string; store: Store };
export type EnableInput = StoreInput & {
  webhookUrl: string;
  flowId: string;
  profileId?: string;
  selected: string[];
};
export type RunInput = StoreInput & {
  payload: { rawBody?: unknown; headers: Record<string, unknown> };
  selected: string[];
};
export type PendingWebhook = {
  kind: 'pending';
  profileId?: string;
  idempotencyKey: string;
  createdAt: number;
  request: WebhookRequest;
};
export type ActiveWebhook = Omit<PendingWebhook, 'kind'> & {
  kind: 'active';
  id: string;
  secret: EncryptedSecret;
};
export type WebhookState = PendingWebhook | ActiveWebhook;
