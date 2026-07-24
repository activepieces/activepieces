import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { couponOutputSchema } from '../output-schemas';
export const stripeGetCoupon = createAction({
  name: 'get_coupon',
  auth: stripeAuth,
  displayName: 'Get Coupon (Agent)',
  description: 'Retrieve a coupon by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single coupon by its ID. Use List Coupons to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    coupon_id: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'The coupon ID. Obtain it from List Coupons.',
      required: true,
    }),
  },
  outputSchema: couponOutputSchema,
  async run(context) {
    const { coupon_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/coupons/${coupon_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
