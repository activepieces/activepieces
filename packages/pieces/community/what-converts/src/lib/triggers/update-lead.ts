import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';

export const updatedLeadTrigger = createTrigger({
  auth: whatConvertsAuth,
  name: 'updated_lead',
  displayName: 'Updated Lead',
  description: 'Fires when an existing lead is updated in WhatConverts.',
  props: {},
  sampleData: {
    lead_id: 987654,
    profile_id: 12345,
    lead_type: 'Web Form',
    lead_source: 'google',
    lead_medium: 'organic',
    lead_campaign: null,
    quotable: 'Yes',
    sales_value: '250.50',
    created_on: '2025-09-21 13:07:00',
    lead_details: [
      {
        label: 'First Name',
        value: 'Jane',
      },
      {
        label: 'Last Name',
        value: 'Doe',
      },
      {
        label: 'Email',
        value: 'jane.doe@example.com',
      },
      {
        label: 'Notes',
        value: 'Inquiring about pricing. Followed up on 2025-09-21.',
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    await whatConvertsClient.subscribeWebhook(
      context.auth,
      'lead_update',
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
    return [context.payload.body];
  },
});
