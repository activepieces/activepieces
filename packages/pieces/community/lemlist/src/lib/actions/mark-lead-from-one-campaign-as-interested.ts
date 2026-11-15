import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const markLeadFromOneCampaignAsInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromOneCampaignAsInterested',
  classification: 'WRITE',
  displayName: 'Mark Lead From One Campaign as Interested',
  description: 'Mark a lead in a campaign as interested.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sets the "interested" status on a lead in one Lemlist campaign, identified by campaign and lead email. Idempotent.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as interested.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.lead,
  async run({ auth, propsValue }) {
    return lemlistLeads.setInterestInCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaignId,
      lead: propsValue.email,
      interested: true,
    });
  },
});
