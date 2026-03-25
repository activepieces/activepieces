import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { rewardfulAuth } from '../auth';
import { RewardfulAffiliate, RewardfulListResponse, rewardfulApiCall } from '../common/client';

export const listAffiliatesAction = createAction({
  auth: rewardfulAuth,
  name: 'list_affiliates',
  displayName: 'List Affiliates',
  description: 'List Rewardful affiliates with optional filtering.',
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
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
  },
  async run(context) {
    return await rewardfulApiCall<RewardfulListResponse<RewardfulAffiliate>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: '/affiliates',
      query: {
        page: context.propsValue.page,
        limit: context.propsValue.limit,
        campaign_id: context.propsValue.campaignId,
        email: context.propsValue.email,
        expand: context.auth.props.expand,
      },
    });
  },
});
