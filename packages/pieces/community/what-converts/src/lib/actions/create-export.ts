import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { whatConvertsProps } from '../common/props';
import { Lead } from '../common/types';

export const exportLeadsAction = createAction({
  auth: whatConvertsAuth,
  name: 'export_leads',
  displayName: 'Export Leads',
  description:
    'Retrieves all leads from an account, handling pagination automatically.',
  props: {
    account_id: whatConvertsProps.account_id(),
    profile_id: whatConvertsProps.profile_id(),
    from_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'The start date for the export range in YYYY-MM-DD format.',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'End Date',
      description: 'The end date for the export range in YYYY-MM-DD format.',
      required: false,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type (Optional)',
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
      description: 'Number of leads to fetch per page (max 1000).',
      required: false,
      defaultValue: 25,
    }),
    no_of_pages: Property.Number({
      displayName: 'Number of Pages',
      description: 'The number of pages to retrieve (max 100).',
      required: false,
      defaultValue: 1,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const { profile_id, from_date, to_date, lead_type, per_page } = propsValue;

    if (profile_id === undefined) {
      throw new Error('Profile ID is required for exporting leads.');
    }

    const initialResponse = await whatConvertsClient.findLeads(auth, {
      profile_id: profile_id,
      from_date: from_date,
      to_date: to_date,
      lead_type: lead_type,
      per_page: per_page,
      page_number: 1,
    });

    let allLeads: Lead[] = initialResponse.leads || [];
    const totalPages = Math.min(
      initialResponse.total_pages || 1,
      propsValue.no_of_pages || 1,
      100
    );

    for (let page = 2; page <= totalPages; page++) {
      const response = await whatConvertsClient.findLeads(auth, {
        profile_id: profile_id,
        from_date: from_date,
        to_date: to_date,
        lead_type: lead_type,
        per_page: per_page,
        page_number: page,
      });
      allLeads = allLeads.concat(response.leads || []);
    }

    return allLeads;
  },
});
