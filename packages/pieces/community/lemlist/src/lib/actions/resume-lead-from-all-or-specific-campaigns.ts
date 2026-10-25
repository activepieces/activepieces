import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const resumeLeadFromAllOrSpecificCampaigns = createAction({
  auth: lemlistAuth,
  name: 'resumeLeadFromAllOrSpecificCampaigns',
  classification: 'WRITE',
  displayName: 'Resume Lead From All or Specific Campaigns',
  description: 'Resume a lead’s outreach across all or specific campaigns. Resumed leads can receive emails right away.',
  audience: 'human',
  aiMetadata: {
    description:
      'Resumes outreach for a paused lead, identified by email, in one campaign or, with no campaign, in all campaigns. Resumed leads can receive real emails from running campaigns. Idempotent.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to resume.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.leadList,
  async run({ auth, propsValue }) {
    return lemlistLeads.setLeadPaused({
      apiKey: auth.secret_text,
      lead: propsValue.email,
      campaignId: propsValue.campaignId,
      paused: false,
    });
  },
});
