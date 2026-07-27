import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { findHeader, verifyWebhookSignature } from '../common/signature';
import type { EventEnvelope, RenderLike, WebhookSubscription } from '../common/types';

export interface DeliveryParams {
  rawBody: unknown;
  body: unknown;
  headers: Record<string, string>;
  secret: string | undefined;
  events: string[];
  now?: number;
}

/**
 * Turn one webhook delivery into the array a trigger must return.
 *
 * Fails closed: any verification failure yields an empty array, which produces
 * no flow run at all. Returning the envelope's `data.object` (not the envelope)
 * matches every other Polotno Studio integration.
 */
export function handleWebhookDelivery(params: DeliveryParams): RenderLike[] {
  if (!params.secret) return [];

  const signature = findHeader(params.headers, 'x-signature');
  const verification = verifyWebhookSignature(signature, params.rawBody, params.secret, params.now);
  if (!verification.ok) return [];

  // Fail closed: an absent x-event-type is not a subscribed type either, so it
  // is rejected rather than waved through.
  const eventType = findHeader(params.headers, 'x-event-type');
  if (!eventType || !params.events.includes(eventType)) return [];

  const body = params.body as EventEnvelope | undefined;
  const object = body?.data?.object;
  if (!object || typeof object !== 'object' || typeof object.id !== 'string') return [];

  return [object];
}

interface RenderTriggerConfig {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  events: string[];
  sampleData: unknown;
}

export function createRenderTrigger(config: RenderTriggerConfig) {
  // Keyed per step: two Polotno triggers can share one flow, and the store is
  // flow-scoped, so a fixed key would let one overwrite the other's secret.
  const storeKey = (stepName: string) => `_polotno_webhook_${stepName}`;

  return createTrigger({
    auth: polotnoStudioAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    aiMetadata: { description: config.aiDescription },
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: config.sampleData,

    async onEnable(context) {
      const client = createClient(context.auth.secret_text);
      const subscription = await client.request<WebhookSubscription>({
        method: HttpMethod.POST,
        path: '/v1/webhooks',
        body: {
          url: context.webhookUrl,
          events: config.events,
          description: `Activepieces: ${config.displayName}`,
        },
      });
      // `secret` is returned only at creation — losing it means every later
      // delivery fails verification.
      await context.store.put(storeKey(context.step.name), {
        id: subscription.id,
        secret: subscription.secret,
      });
    },

    async onDisable(context) {
      const key = storeKey(context.step.name);
      const stored = await context.store.get<{ id: string; secret: string }>(key);
      if (stored?.id) {
        try {
          const client = createClient(context.auth.secret_text);
          await client.request({ method: HttpMethod.DELETE, path: `/v1/webhooks/${stored.id}` });
        } catch {
          // Disabling a flow must succeed even when the API is unreachable; the
          // subscription is replaced on the next enable.
        }
      }
      await context.store.delete(key);
    },

    async run(context) {
      const stored = await context.store.get<{ id: string; secret: string }>(storeKey(context.step.name));
      return handleWebhookDelivery({
        rawBody: context.payload.rawBody,
        body: context.payload.body,
        headers: context.payload.headers,
        secret: stored?.secret,
        events: config.events,
      });
    },
  });
}
