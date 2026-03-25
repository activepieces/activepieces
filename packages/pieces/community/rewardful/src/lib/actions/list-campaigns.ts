import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { rewardfulAuth } from '../auth';
import { RewardfulCampaign, RewardfulListResponse, rewardfulApiCall } from '../common/client';

export const listCampaignsAction = createAction({
  auth: rewardfulAuth,
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'List Rewardful campaigns.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    return await rewardfulApiCall<RewardfulListResponse<RewardfulCampaign>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: '/campaigns',
      query: {
        page: context.propsValue.page,
        limit: context.propsValue.limit,
      },
    });
  },
});
