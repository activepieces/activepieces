import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromOneCampaignAsNotInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromOneCampaignAsNotInterested',
  displayName: 'Mark Lead From One Campaign as Not Interested',
  description: 'Mark a lead in a campaign as not interested.',
  audience: 'both',
  aiMetadata: { description: 'Sets the "not interested" status on a lead within one specific Lemlist campaign, identified by the campaign and the lead\'s email. Use when disqualifying interest scoped to a single campaign rather than across all of them. Idempotent: re-running leaves the lead in the same not-interested state.', idempotent: true },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as not interested.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.markLeadAsNotInterestedInCampaign(auth, {
      campaignId: campaignId as string,
      leadEmail: email as string,
    });
  },
});
