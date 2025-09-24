import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';

export const updatedLeadTrigger = createTrigger({
  auth: whatConvertsAuth,
  name: 'updated_lead',
  displayName: 'Updated Lead',
  description: 'Fires when an existing lead is updated in WhatConverts.',
  props: {},
  sampleData: {
    trigger: 'update',
    lead_id: 153928,
    lead_type: 'Phone Call',
    lead_status: 'Unique',
    last_updated: '2016-01-25T17:18:20Z',
    quotable: 'Not Set',
    sales_value: null,
  },
  type: TriggerStrategy.APP_WEBHOOK,

  async onEnable(_context) {
    // User configures the webhook manually in the WhatConverts UI.
  },

  async onDisable(_context) {
    // User removes the webhook manually in the WhatConverts UI.
  },

  async run(context) {
    const payloadBody = context.payload.body as { trigger: string };

    if (payloadBody.trigger !== 'update') {
      return [];
    }

    return [context.payload.body];
  },
});
