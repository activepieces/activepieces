import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyWebhook, InstantlyWebhookPayload } from '../common/types';

function createWebhookTrigger({
  name,
  displayName,
  description,
  eventType,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  sampleData: InstantlyWebhookPayload;
}) {
  return createTrigger({
    auth: instantlyAuth,
    name,
    displayName,
    description,
    props: {
      campaign_id: instantlyProps.campaignId(false),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable(context) {
      const webhook = await instantlyClient.createWebhook({
        auth: context.auth.secret_text,
        webhookUrl: context.webhookUrl,
        eventType,
        campaignId: context.propsValue.campaign_id ?? undefined,
      });

      await context.store.put<InstantlyWebhook>('webhook', webhook);
    },
    async onDisable(context) {
      const webhook = await context.store.get<InstantlyWebhook>('webhook');

      if (webhook) {
        await instantlyClient.deleteWebhook({
          auth: context.auth.secret_text,
          webhookId: webhook.id,
        });
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}

function createDynamicWebhookTrigger({
  name,
  displayName,
  description,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  sampleData: InstantlyWebhookPayload;
}) {
  return createTrigger({
    auth: instantlyAuth,
    name,
    displayName,
    description,
    props: {
      event_type: instantlyProps.webhookEventType(true),
      campaign_id: instantlyProps.campaignId(false),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable(context) {
      const eventType = context.propsValue.event_type;
      if (!eventType) {
        throw new Error('Event type is required.');
      }
      const webhook = await instantlyClient.createWebhook({
        auth: context.auth.secret_text,
        webhookUrl: context.webhookUrl,
        eventType,
        campaignId: context.propsValue.campaign_id ?? undefined,
      });

      await context.store.put<InstantlyWebhook>('webhook', webhook);
    },
    async onDisable(context) {
      const webhook = await context.store.get<InstantlyWebhook>('webhook');

      if (webhook) {
        await instantlyClient.deleteWebhook({
          auth: context.auth.secret_text,
          webhookId: webhook.id,
        });
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}

export const instantlyTriggerFactory = {
  createWebhookTrigger,
  createDynamicWebhookTrigger,
};
