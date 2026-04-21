import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyWebhook, InstantlyWebhookPayload } from '../common/types';

function hasProperty<K extends PropertyKey>(
  obj: object,
  key: K,
): obj is Record<K, unknown> {
  return key in obj;
}

function extractEventType(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !hasProperty(body, 'event_type')) {
    return undefined;
  }
  const { event_type } = body;
  return typeof event_type === 'string' ? event_type : undefined;
}

function createGroupedWebhookTrigger({
  name,
  displayName,
  description,
  eventOptions,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventOptions: Array<{ label: string; value: string }>;
  sampleData: InstantlyWebhookPayload;
}) {
  return createTrigger({
    auth: instantlyAuth,
    name,
    displayName,
    description,
    props: {
      event_types: Property.StaticMultiSelectDropdown({
        displayName: 'Event Types',
        description: 'Select which events should trigger this flow.',
        required: true,
        options: {
          options: eventOptions,
        },
      }),
      campaign_id: instantlyProps.campaignId(false),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable(context) {
      const webhook = await instantlyClient.createWebhook({
        auth: context.auth.secret_text,
        webhookUrl: context.webhookUrl,
        eventType: 'all_events',
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
      const eventType = extractEventType(context.payload.body);
      const selectedEvents: string[] = context.propsValue.event_types ?? [];

      if (!eventType || !selectedEvents.includes(eventType)) {
        return [];
      }

      return [context.payload.body];
    },
  });
}

export const instantlyTriggerFactory = {
  createGroupedWebhookTrigger,
};
