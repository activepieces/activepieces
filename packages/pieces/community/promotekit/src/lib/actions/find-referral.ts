import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall, promotekitCommon } from '../common';

export const findReferral = createAction({
  auth: promotekitAuth,
  name: 'find_referral',
  displayName: 'Find Referral',
  description: 'Get details of a specific referral by ID.',
  props: {
    referral_id: Property.ShortText({
      displayName: 'Referral ID',
      description: 'The ID of the referral to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/referrals/${context.propsValue.referral_id}`,
    });
    return promotekitCommon.flattenReferral(response.body.data);
  },
});
