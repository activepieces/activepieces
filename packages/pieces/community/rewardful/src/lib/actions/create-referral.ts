import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { rewardfulAuth } from '../auth';
import { RewardfulReferral, rewardfulApiCall } from '../common/client';

export const createReferralAction = createAction({
  auth: rewardfulAuth,
  name: 'create_referral',
  displayName: 'Create Referral',
  description: 'Create a Rewardful referral.',
  props: {
    affiliateId: Property.ShortText({
      displayName: 'Affiliate ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Customer Email',
      required: true,
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    stripeCustomerId: Property.ShortText({
      displayName: 'Stripe Customer ID',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional custom metadata to send with the referral payload.',
      required: false,
    }),
  },
  async run(context) {
    const metadata = context.propsValue.metadata;

    return await rewardfulApiCall<RewardfulReferral>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      resourceUri: '/referrals',
      body: {
        affiliate_id: context.propsValue.affiliateId,
        email: context.propsValue.email,
        campaign_id: context.propsValue.campaignId,
        first_name: context.propsValue.firstName,
        last_name: context.propsValue.lastName,
        stripe_customer_id: context.propsValue.stripeCustomerId,
        ...(metadata && typeof metadata === 'object' ? { metadata } : {}),
      },
    });
  },
});
