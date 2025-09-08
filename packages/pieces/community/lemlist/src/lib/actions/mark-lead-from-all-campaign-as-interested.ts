import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromAllCampaignAsInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromAllCampaignAsInterested',
  displayName: 'Mark Lead From All Campaign as Interested',
  description: 'Mark a lead as “interested” across all campaigns.',
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as interested.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { email } }) {
    return await lemlistApiService.markLeadAsInterestedInAllCampaigns(auth, {
      leadEmail: email as string,
    });
  },
});
