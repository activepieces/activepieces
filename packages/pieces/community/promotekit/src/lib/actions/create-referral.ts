import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const createReferral = createAction({
  auth: promotekitAuth,
  name: 'create_referral',
  displayName: 'Create Referral',
  description: 'Create a new referral in PromoteKit.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the referred person.',
      required: true,
    }),
    affiliate_id: promotekitCommon.affiliateDropdown,
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: '/referrals',
      body: {
        email: context.propsValue.email,
        affiliate_id: context.propsValue.affiliate_id,
      },
    });
    return promotekitCommon.flattenReferral(response.body.data);
  },
});
