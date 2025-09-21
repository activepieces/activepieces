import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { profileDropdown } from '../common/props'; // Import the new profile dropdown

export const createExport = createAction({
  auth: whatConvertsAuth,
  name: 'create_export',
  displayName: 'Create Export',
  description: 'Generate a new "leads export" by fetching a list of leads with filters.',
  props: {
    profile_id: profileDropdown(), 
    start_date: Property.DateTime({
        displayName: 'Start Date',
        description: 'The start date for the export (in UTC).',
        required: false,
    }),
    end_date: Property.DateTime({
        displayName: 'End Date',
        description: 'The end date for the export (in UTC).',
        required: false,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'Filter by a specific lead type.',
      required: false,
      options: {
        options: [
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Web Form', value: 'web_form' },
          { label: 'Chat', value: 'chat' },
          { label: 'Email', value: 'email' },
          { label: 'Event', value: 'event' },
          { label: 'Text Message', value: 'text_message' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    lead_source: Property.ShortText({
        displayName: 'Lead Source',
        description: "Filter by the lead's source.",
        required: false,
    }),
    lead_medium: Property.ShortText({
        displayName: 'Lead Medium',
        description: "Filter by the lead's medium.",
        required: false,
    }),
    lead_campaign: Property.ShortText({
        displayName: 'Lead Campaign',
        description: "Filter by the lead's campaign.",
        required: false,
    }),
    leads_per_page: Property.Number({
        displayName: 'Limit',
        description: 'The maximum number of leads to return (default 25, max 2500).',
        required: false
    })
  },
  async run(context) {
    const { auth, propsValue } = context;
    const params: Record<string, string> = {};
    for (const key in propsValue) {
        if (Object.prototype.hasOwnProperty.call(propsValue, key)) {
            const value = propsValue[key as keyof typeof propsValue];
            if (value !== undefined && value !== null && value !== '') {
                params[key] = String(value);
            }
        }
    }

    return await whatConvertsClient.getLeads(auth, params);
  },
});