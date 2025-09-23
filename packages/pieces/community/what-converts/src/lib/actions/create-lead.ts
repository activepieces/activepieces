import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsProps } from '../common/props';
import { whatConvertsClient } from '../common/client';

export const createLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead in WhatConverts.',
  props: {
    account_id: whatConvertsProps.account_id(),
    profile_id: whatConvertsProps.profile_id(),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'The type of the lead.',
      required: true,
      options: {
        options: [
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Web Form', value: 'web_form' },
          { label: 'Chat', value: 'chat' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Event', value: 'event' },
          { label: 'Appointment', value: 'appointment' },
          { label: 'Text Message', value: 'text_message' },
        ],
      },
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    referring_source: Property.StaticDropdown({
      displayName: 'Referring Source',
      description: 'The source of the lead (e.g., "google").',
      required: false,
      options: {
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Direct Traffic', value: '(direct)' },
        ],
      },
    }),
    referring_medium: Property.StaticDropdown({
      displayName: 'Referring Medium',
      description: 'The medium of the lead (e.g., "cpc").',
      required: false,
      options: {
        options: [
          { label: 'Organic Search', value: 'organic' },
          { label: 'Paid Search (CPC)', value: 'cpc' },
          { label: 'Social Media', value: 'social' },
          { label: 'Email', value: 'email' },
          { label: 'Referral', value: 'referral' },
          { label: 'Display Ad', value: 'display' },
          { label: 'None (for Direct Traffic)', value: '(none)' },
        ],
      },
    }),
    send_notification: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Set to true to send a new lead notification email.',
      required: true,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    if (propsValue.account_id === undefined) {
      throw new Error('Account ID is required.');
    }
    if (propsValue.profile_id === undefined) {
      throw new Error('Profile ID is required.');
    }

    const contactName = [propsValue.first_name, propsValue.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return await whatConvertsClient.createLead(auth, {
      profile_id: propsValue.profile_id,
      lead_type: propsValue.lead_type,
      send_notification: propsValue.send_notification,

      referring_source: propsValue.referring_source,
      referring_medium: propsValue.referring_medium,
      caller_name: callerName || undefined,
      email_address: propsValue.email,
      phone_number: propsValue.phone_number,
    });
  },
});
