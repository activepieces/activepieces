import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { rewardfulAuth } from '../auth';
import { RewardfulReferral, rewardfulApiCall } from '../common/client';

export const getReferralAction = createAction({
  auth: rewardfulAuth,
  name: 'get_referral',
  displayName: 'Get Referral',
  description: 'Get a Rewardful referral by ID.',
  props: {
    referralId: Property.ShortText({
      displayName: 'Referral ID',
      required: true,
    }),
  },
  async run(context) {
    return await rewardfulApiCall<RewardfulReferral>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      resourceUri: `/referrals/${context.propsValue.referralId}`,
    });
  },
});
