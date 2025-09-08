import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const resumeLeadFromAllOrSpecificCampaigns = createAction({
  auth: lemlistAuth,
  name: 'resumeLeadFromAllOrSpecificCampaigns',
  displayName: 'Resume Lead From All or Specific Campaigns',
  description: 'Resume a lead’s outreach across all or specific campaigns.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to resume.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.resumeLeadInSpecificOrAllCampaigns(auth, {
      campaignId: campaignId as string,
      leadEmail: email as string,
    });
  },
});
