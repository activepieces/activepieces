import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const searchLead = createAction({
  auth: lemlistAuth,
  name: 'searchLead',
  displayName: 'Search Lead',
  description: 'Look up a lead by email and campaign.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to look up',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, campaignId } = propsValue as {
      email: string;
      campaignId: string;
    };

    const leads = await lemlistApiService.getLeadByEmail(auth, email);

    if (!Array.isArray(leads) || leads.length === 0) {
      return { found: false, message: `No leads found for ${email}` };
    }

    const matching = campaignId
      ? leads.filter((lead) => lead.campaign.id === campaignId)
      : leads;

    if (matching.length === 0) {
      return {
        found: false,
        message: `Lead with email ${email} not found in campaign ${campaignId}`,
      };
    }

    return { found: true, leads: matching };
  },
});
