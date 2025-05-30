import { zagomailAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { campaignUid } from '../common/props';

export const getCampaignDetails = createAction({
  auth: zagomailAuth,
  name: 'getCampaignDetails',
  displayName: 'Get Campaign',
  description: 'Gets the details of a campaign.',
  props: {
    campaignUid: campaignUid,
  },
  async run({propsValue, auth}) {
    const campaignUid = propsValue.campaignUid;

    return await zagoMailApiService.getCampaignDetails(auth, campaignUid)
  },
});
