import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';

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
    trigger: 'new',
    lead_id: 153928,
    lead_type: 'Phone Call',
    lead_status: 'Unique',
    date_created: '2016-02-01T14:09:01Z',
    profile_id: 51497,
    account_id: 27313,
    contact_name: 'Jeremy Helms',
    contact_email_address: 'hello@whatconverts.com',
  },
  type: TriggerStrategy.APP_WEBHOOK,

  async onEnable(_context) {
    // User configures the webhook manually in the WhatConverts UI.
  },

  async onDisable(_context) {
    // User removes the webhook manually in the WhatConverts UI.
  },

  async run(context) {
    const payloadBody = context.payload.body as {
      trigger: string;
      lead_type: string;
    };
    const selectedLeadType = context.propsValue.lead_type;

    if (payloadBody.trigger !== 'new') {
      return [];
    }

    if (selectedLeadType && payloadBody.lead_type !== selectedLeadType) {
      return [];
    }

    return [context.payload.body];
  },
});
