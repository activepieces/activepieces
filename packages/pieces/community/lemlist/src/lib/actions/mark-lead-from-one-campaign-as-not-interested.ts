import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromOneCampaignAsNotInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromOneCampaignAsNotInterested',
  displayName: 'Mark Lead From One Campaign as Not Interested',
  description: 'Mark a lead in a campaign as not interested.',
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
