import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsProps } from '../common/props';
import { whatConvertsClient } from '../common/client';

export const findLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead by various criteria.',
  props: {
    account_id: whatConvertsProps.account_id(),
    profile_id: whatConvertsProps.profile_id(),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Find a lead by their email address.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Find a lead by their E.164 formatted phone number.',
      required: false,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'Filter leads by their type.',
      required: false,
      options: {
        options: [
          { label: 'Appointment', value: 'appointment' },
          { label: 'Chat', value: 'chat' },
          { label: 'Email', value: 'email' },
          { label: 'Event', value: 'event' },
          { label: 'Other', value: 'other' },
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Text Message', value: 'text_message' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Web Form', value: 'web_form' },
        ],
      },
    }),
    per_page: Property.Number({
      displayName: 'Leads Per Page',
      description: 'The number of leads to return (default 25, max 2500).',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const searchCriteria = [
      propsValue.email_address,
      propsValue.phone_number,
      propsValue.lead_type,
    ];

    if (searchCriteria.every((criterion) => !criterion)) {
      throw new Error(
        'Please provide at least one search criteria (Email, Phone, or Lead Type).'
      );
    }

    return await whatConvertsClient.findLeads(auth, {
      profile_id: propsValue.profile_id,
      email_address: propsValue.email_address,
      phone_number: propsValue.phone_number,
      lead_type: propsValue.lead_type,
      per_page: propsValue.per_page,
    });
  },
});
