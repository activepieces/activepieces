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
    profile_id: whatConvertsProps.profile_id(),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'The type of the lead.',
      required: true,
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
    referring_source: Property.ShortText({
      displayName: 'Referring Source',
      description: 'The source of the lead (e.g., "google").',
      required: false,
    }),
    referring_medium: Property.ShortText({
      displayName: 'Referring Medium',
      description: 'The medium of the lead (e.g., "cpc").',
      required: false,
    }),
    send_notification: Property.Checkbox({
      displayName: 'Send Notification',
      description: 'Set to true to send a new lead notification email.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    if (propsValue.profile_id === undefined) {
      throw new Error('Profile ID is required.');
    }

    const leadDetails: { [key: string]: unknown } = {};

    const addDetailIfExists = (key: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== '') {
        leadDetails[key] = value;
      }
    };

    addDetailIfExists('first_name', propsValue.first_name);
    addDetailIfExists('last_name', propsValue.last_name);
    addDetailIfExists('email', propsValue.email);
    addDetailIfExists('phone_number', propsValue.phone_number);
    addDetailIfExists('company_name', propsValue.company_name);
    addDetailIfExists('notes', propsValue.notes);

    return await whatConvertsClient.createLead(auth, {
      profile_id: propsValue.profile_id, 
      lead_type: propsValue.lead_type,
      referring_source: propsValue.referring_source,
      referring_medium: propsValue.referring_medium,
      send_notification: propsValue.send_notification,
      lead_details: leadDetails,
    });
  },
});
