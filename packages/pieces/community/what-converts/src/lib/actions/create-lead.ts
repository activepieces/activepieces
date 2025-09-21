import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { profileDropdown } from '../common/props'; 

export const createLead = createAction({
  auth: whatConvertsAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead in WhatConverts.',
  props: {
    profile_id: profileDropdown(),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'The type of lead to create.',
      required: true,
      options: {
        options: [
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Web Form', value: 'web_form' },
          { label: 'Appointment', value: 'appointment' },
          { label: 'Chat', value: 'chat' },
          { label: 'Email', value: 'email' },
          { label: 'Event', value: 'event' },
          { label: 'Text Message', value: 'text_message' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    send_notification: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Send an email notification for this lead.',
      required: true,
      defaultValue: false,
    }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      description: 'The traffic source for the lead (e.g., "google").',
      required: false,
    }),
    lead_medium: Property.ShortText({
      displayName: 'Lead Medium',
      description: 'The traffic medium for the lead (e.g., "cpc").',
      required: false,
    }),
    lead_campaign: Property.ShortText({
      displayName: 'Lead Campaign',
      description: 'The campaign value for the lead.',
      required: false,
    }),
    quote_value: Property.Number({
      displayName: 'Quote Value',
      required: false,
    }),
    sales_value: Property.Number({
      displayName: 'Sales Value',
      required: false,
    }),
    additional_fields: Property.Object({
      displayName: 'Additional Fields',
      description: 'Provide any other fields as key-value pairs.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await whatConvertsClient.createLead(auth, propsValue);
  },
});