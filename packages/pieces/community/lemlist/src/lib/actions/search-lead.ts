import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistInput } from '../common/input';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const searchLead = createAction({
  auth: lemlistAuth,
  name: 'searchLead',
  classification: 'READ',
  displayName: 'Search Lead',
  description: 'Look up a lead by email and campaign.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up the leads for one email across Lemlist campaigns, optionally filtered to one campaign. Returns found=false when nothing matches. Read-only.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to look up',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.leadsByEmail,
  async run({ auth, propsValue }) {
    const email = lemlistInput.email({ value: propsValue.email, label: 'Lead Email' });
    const campaignId = lemlistInput.optionalText(propsValue.campaignId);
    const leads = await lemlistLeads.getLeadsByEmail({ apiKey: auth.secret_text, email });
    if (leads.length === 0) {
      return { found: false, message: `No leads found for ${email}`, leads: [] };
    }
    const matching =
      campaignId === undefined
        ? leads
        : leads.filter((lead) => lemlistLeads.leadCampaignId(lead) === campaignId);
    if (matching.length === 0) {
      return {
        found: false,
        message: `Lead with email ${email} not found in campaign ${campaignId}`,
        leads: [],
      };
    }
    return { found: true, leads: matching };
  },
});
