import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const pauseLeadFromAllOrSpecificCampaigns = createAction({
  auth: lemlistAuth,
  name: 'pauseLeadFromAllOrSpecificCampaigns',
  classification: 'WRITE',
  displayName: 'Pause Lead From All or Specific Campaigns',
  description: 'Pause a lead’s outreach across all or specific campaigns.',
  audience: 'human',
  aiMetadata: {
    description:
      'Pauses outreach for a lead, identified by email, in one campaign or, with no campaign, in all campaigns. Reversible with Resume. Idempotent.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to pause.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.leadList,
  async run({ auth, propsValue }) {
    return lemlistLeads.setLeadPaused({
      apiKey: auth.secret_text,
      lead: propsValue.email,
      campaignId: propsValue.campaignId,
      paused: true,
    });
  },
});
