import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromOneCampaignAsInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromOneCampaignAsInterested',
  displayName: 'Mark Lead From One Campaign as Interested',
  description: 'Mark a lead in a campaign as interested.',
  props: {
    campaignId: campaignsDropdown({refreshers: ['auth']}),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as interested.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.markLeadAsInterestedInCampaign(
      auth,
      {
        campaignId: campaignId as string,
        leadEmail: email as string,
      }
    );
  },
});
