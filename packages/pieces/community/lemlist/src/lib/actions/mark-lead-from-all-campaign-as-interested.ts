import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const markLeadFromAllCampaignAsInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromAllCampaignAsInterested',
  classification: 'WRITE',
  displayName: 'Mark Lead From All Campaign as Interested',
  description: 'Mark a lead as “interested” across all campaigns.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the "interested" status on a lead, identified by email, in every Lemlist campaign the lead belongs to. Returns the updated lead records (one per campaign). For a single campaign use the per-campaign variant. Idempotent: re-running leaves the lead interested.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as interested.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.leadList,
  async run({ auth, propsValue }) {
    return lemlistLeads.setInterestEverywhere({ apiKey: auth.secret_text, lead: propsValue.email, interested: true });
  },
});
