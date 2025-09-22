import { createAction, Property } from '@activepieces/pieces-framework';
import { campaignsDropdown } from '../common/props';
import { lemlistAuth } from '../common/constants';
import { lemlistApiService } from '../common/requests';

export const pauseLeadFromAllOrSpecificCampaigns = createAction({
  auth: lemlistAuth,
  name: 'pauseLeadFromAllOrSpecificCampaigns',
  displayName: 'Pause Lead From All or Specific Campaigns',
  description: 'Pause a lead’s outreach across all or specific campaigns.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to pause.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.pauseLeadInSpecificOrAllCampaigns(auth, {
      campaignId: campaignId as string,
      leadEmail: email as string,
    });
  },
});
