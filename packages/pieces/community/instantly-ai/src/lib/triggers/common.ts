import {
  createTrigger,
  Property,
  TriggerStrategy,
  tryCatch,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead, InstantlyWebhook, InstantlyWebhookPayload } from '../common/types';

function hasEventType(body: unknown): body is { event_type: unknown } {
  return typeof body === 'object' && body !== null && 'event_type' in body;
}

function extractEventType(body: unknown): string | undefined {
  if (!hasEventType(body)) {
    return undefined;
  }
  const { event_type } = body;
  return typeof event_type === 'string' ? event_type : undefined;
}

function createGroupedWebhookTrigger({
  name,
  displayName,
  description,
  aiDescription,
  eventOptions,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  eventOptions: Array<{ label: string; value: string }>;
  sampleData: InstantlyWebhookPayload;
}) {
  return createTrigger({
    auth: instantlyAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: {
      description: aiDescription,
    },
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
    async test(context) {
      const campaignId = context.propsValue.campaign_id ?? undefined;
      const { data: leads } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyLead>({
          auth: context.auth.secret_text,
          path: 'leads/list',
          method: HttpMethod.POST,
          body: campaignId ? { campaign: campaignId } : undefined,
          maxPages: 1,
        }),
      );

      const lead = leads?.[0];
      return [{ ...sampleData, ...(lead ? { lead_email: lead.email } : {}) }];
    },
    async run(context) {
      const eventType = extractEventType(context.payload.body);
      const selectedEvents: string[] = context.propsValue.event_types ?? [];

      if (!eventType || !selectedEvents.includes(EVENT_TYPE_ALIASES[eventType] ?? eventType)) {
        return [];
      }

      return [context.payload.body];
    },
  });
}

const EVENT_TYPE_ALIASES: Record<string, string> = {
  link_clicked: 'email_link_clicked',
};

export const instantlyTriggerFactory = {
  createGroupedWebhookTrigger,
};
