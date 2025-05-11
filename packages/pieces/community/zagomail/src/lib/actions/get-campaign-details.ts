import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';

export const getCampaignDetails = createAction({
  auth: zagomailAuth,
  name: 'getCampaignDetails',
  displayName: 'Get Campaign Details',
  description: 'Get the details of a campaign',
  props: {
    campaignUid: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign you want to get the details for',
      required: true,
    }),
  },
  async run({propsValue, auth}) {
    const campaignUid = propsValue.campaignUid;

    return await zagoMailApiService.getCampaignDetails(auth, campaignUid)
  },
});
