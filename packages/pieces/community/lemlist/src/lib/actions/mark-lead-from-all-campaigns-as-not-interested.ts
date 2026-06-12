import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromAllCampaignsAsNotInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromAllCampaignsAsNotInterested',
  displayName: 'Mark Lead From All Campaigns as Not Interested',
  description: 'Mark a lead as “not interested” across all campaigns.',
  audience: 'both',
  aiMetadata: { description: 'Sets the "not interested" status on a lead, identified by email, across every Lemlist campaign the lead belongs to. Use when disqualifying interest globally; for a single campaign use the per-campaign variant instead. Idempotent: re-running leaves the lead in the same not-interested state.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as not interested.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { email } }) {
    return await lemlistApiService.markLeadAsNotInterestedInAllCampaigns(auth, {
      leadEmail: email as string,
    });
  },
});
