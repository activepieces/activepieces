import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, tryCatch } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { readEventEnvelopeObject } from '../common/event-envelope';
import { signatureUtils } from '../common/signature';
import type { RenderEventObject, WebhookSubscription } from '../common/types';

export function handleWebhookDelivery(params: DeliveryParams): RenderEventObject[] {
  if (!params.secret) return [];

  const signature = signatureUtils.findHeader({ headers: params.headers, name: 'x-signature' });
  const verification = signatureUtils.verifyWebhookSignature({
    header: signature,
    rawBody: params.rawBody,
    secret: params.secret,
    nowSeconds: params.now,
  });
  if (!verification.ok) return [];

  const eventType = signatureUtils.findHeader({ headers: params.headers, name: 'x-event-type' });
  if (!eventType || !params.events.includes(eventType)) return [];

  const object = readEventEnvelopeObject(params.body);
  if (!object) return [];

  return [object];
}

export function createRenderTrigger(config: RenderTriggerConfig) {
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
      const client = createClient({ apiKey: context.auth.secret_text });
      const subscription = await client.request<WebhookSubscription>({
        method: HttpMethod.POST,
        path: '/v1/webhooks',
        body: {
          url: context.webhookUrl,
          events: config.events,
          description: `Activepieces: ${config.displayName}`,
        },
      });
      await context.store.put(storeKey(context.step.name), {
        id: subscription.id,
        secret: subscription.secret,
      });
    },

    async onDisable(context) {
      const key = storeKey(context.step.name);
      const stored = await context.store.get<{ id: string; secret: string }>(key);
      if (stored?.id) {
        await tryCatch(async () => {
          const client = createClient({ apiKey: context.auth.secret_text });
          await client.request({ method: HttpMethod.DELETE, path: `/v1/webhooks/${stored.id}` });
        });
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

export interface DeliveryParams {
  rawBody: unknown;
  body: unknown;
  headers: Record<string, string>;
  secret: string | undefined;
  events: string[];
  now?: number;
}

interface RenderTriggerConfig {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  events: string[];
  sampleData: unknown;
}
