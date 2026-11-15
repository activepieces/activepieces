import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const markLeadFromAllCampaignsAsNotInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromAllCampaignsAsNotInterested',
  classification: 'WRITE',
  displayName: 'Mark Lead From All Campaigns as Not Interested',
  description: 'Mark a lead as “not interested” across all campaigns.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the "not interested" status on a lead, identified by email, in every Lemlist campaign the lead belongs to. Returns the updated lead records. For a single campaign use the per-campaign variant. Idempotent: re-running leaves the lead not interested.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as not interested.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.leadList,
  async run({ auth, propsValue }) {
    return lemlistLeads.setInterestEverywhere({ apiKey: auth.secret_text, lead: propsValue.email, interested: false });
  },
});
