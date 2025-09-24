import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';

export const newLeadTrigger = createTrigger({
  auth: whatConvertsAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Fires when a new lead is received.',
  props: {
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'Optionally filter by the type of the lead.',
      required: false,
      options: {
        options: [
          { label: 'Phone Call', value: 'Phone Call' },
          { label: 'Web Form', value: 'Web Form' },
          { label: 'Chat', value: 'Chat' },
          { label: 'Transaction', value: 'Transaction' },
          { label: 'Event', value: 'Event' },
        ],
      },
    }),
  },
  sampleData: {
    lead_id: 112233,
    profile_id: 12345,
    lead_type: 'Phone Call',
    lead_source: 'google',
    lead_medium: 'cpc',
    lead_campaign: 'Summer Sale',
    quotable: 'Yes',
    sales_value: '0.00',
    created_on: '2025-09-21 13:35:00',
    lead_details: [
      { label: 'First Name', value: 'Test' },
      { label: 'Last Name', value: 'Caller' },
      { label: 'Email', value: 'test.caller@example.com' },
      { label: 'Phone Number', value: '+18005551234' },
    ],
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    await whatConvertsClient.subscribeWebhook(
      context.auth,
      'lead_add',
      context.webhookUrl
    );
  },

  async onDisable(context) {
    await whatConvertsClient.unsubscribeWebhook(
      context.auth,
      context.webhookUrl
    );
  },

  async run(context) {
    const leadData = context.payload.body as { lead_type: string };
    const selectedLeadType = context.propsValue.lead_type;

    if (selectedLeadType && leadData.lead_type !== selectedLeadType) {
      return [];
    }

    return [context.payload.body];
  },
});
