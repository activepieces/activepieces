import { createTrigger, isNil, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations, SMARTLEAD_WEBHOOK_EVENTS } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';
import { smartleadProps } from '../common/props';

export const newCampaignEventTrigger = createTrigger({
  auth: smartleadAuth,
  name: 'new_campaign_event',
  classification: 'READ',
  displayName: 'New Campaign Event',
  aiMetadata: {
    description:
      'Fires when a selected event happens in one SmartLead campaign: email sent, opened, link clicked, replied, lead unsubscribed or lead category updated. Registers a webhook on the campaign when enabled and removes it when disabled. The payload carries event_type, campaign id and name, lead id and email, and the email subject.',
  },
  description: 'Triggers when a selected event (email sent, opened, clicked, replied, unsubscribed, category changed) happens in a campaign.',
  props: {
    campaign_id: smartleadProps.campaignDropdown({
      description: 'The campaign to watch.',
    }),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description: 'Which campaign events start the flow.',
      required: true,
      options: { options: SMARTLEAD_WEBHOOK_EVENTS },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: smartleadOutputSchemas.campaignEvent,
  sampleData: {
    event_type: 'EMAIL_REPLY',
    campaign_id: 123456,
    campaign_name: 'AP Test',
    sl_email_lead_id: 987654,
    to_email: 'lead@example.com',
    to_name: 'Jane Doe',
    from_email: 'sender@example.com',
    subject: 'Quick question',
    event_timestamp: '2026-10-27T10:00:00.000Z',
  },
  async onEnable(context) {
    const eventTypes = (context.propsValue.event_types ?? []).filter((e) =>
      SMARTLEAD_WEBHOOK_EVENTS.some((o) => o.value === e)
    );
    if (eventTypes.length === 0) {
      throw new Error('Select at least one event.');
    }
    const webhookId = await smartleadOperations.createCampaignWebhook({
      apiKey: context.auth.secret_text,
      campaignId: context.propsValue.campaign_id,
      webhookUrl: context.webhookUrl,
      eventTypes,
    });
    if (isNil(webhookId)) {
      throw new Error('SmartLead did not return a webhook id, so the webhook could not be tracked.');
    }
    await context.store.put<WebhookInfo>(STORE_KEY, {
      webhookId,
      campaignId: context.propsValue.campaign_id,
    });
  },
  async onDisable(context) {
    const info = await context.store.get<WebhookInfo>(STORE_KEY);
    if (isNil(info)) {
      return;
    }
    await smartleadOperations.deleteCampaignWebhook({
      apiKey: context.auth.secret_text,
      campaignId: info.campaignId,
      webhookId: info.webhookId,
    });
    await context.store.delete(STORE_KEY);
  },
  async run(context) {
    const body = context.payload.body;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return [];
    }
    return [body];
  },
});

type WebhookInfo = { webhookId: number | string; campaignId: number };

const STORE_KEY = 'smartlead_campaign_webhook';

