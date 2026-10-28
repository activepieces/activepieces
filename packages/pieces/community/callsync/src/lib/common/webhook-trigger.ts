import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, canonicalEvent, flatten, isValidSignature } from './client';

type Subscription = { id: string; secret: string };
type Delivery = { event?: unknown; data?: Record<string, unknown> } & Record<string, unknown>;

/**
 * Builds a webhook trigger for one CallSync event. Publishing the flow subscribes its webhook URL in
 * CallSync and keeps the signing secret; every delivery is checked against that secret before the
 * flow runs, and unpublishing removes the subscription.
 */
export function callsyncWebhookTrigger({
  name,
  displayName,
  description,
  aiDescription,
  event,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  event: 'call_logged' | 'recording_updated' | 'ai_analysis' | 'caller_updated';
  sampleData: Record<string, unknown>;
}) {
  const storeKey = `callsync_webhook_${name}`;
  return createTrigger({
    auth: callsyncAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable(context) {
      const response = await callsyncApiCall<{ data: Subscription }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: 'webhooks',
        body: { url: context.webhookUrl, events: [event], name: 'Activepieces' },
      });
      await context.store.put<Subscription>(storeKey, {
        id: response.data.id,
        secret: response.data.secret,
      });
    },
    async onDisable(context) {
      const subscription = await context.store.get<Subscription>(storeKey);
      if (!subscription) return;
      try {
        await callsyncApiCall({
          apiKey: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: 'webhooks',
          query: { id: subscription.id },
        });
      } catch (error) {
        // Already removed in the CallSync dashboard: nothing left to clean up.
        if ((error as { response?: { status?: number } }).response?.status !== 404) throw error;
      }
      await context.store.delete(storeKey);
    },
    async run(context) {
      const subscription = await context.store.get<Subscription>(storeKey);
      const signature = context.payload.headers['x-callsync-signature'];
      const rawBody = context.payload.rawBody ?? context.payload.body;
      if (!isValidSignature(subscription?.secret, signature, rawBody)) return [];
      const delivery = context.payload.body as Delivery;
      if (canonicalEvent(delivery.event) !== event) return [];
      const { data, ...meta } = delivery;
      return [{ ...flatten(meta), ...flatten(data ?? {}) }];
    },
  });
}
