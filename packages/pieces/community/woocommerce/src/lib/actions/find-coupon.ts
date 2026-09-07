import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { findCouponOutputSchema } from '../output-schemas';

export const wooFindCoupon = createAction({
  name: 'Find Coupon',
  classification: 'READ',
  displayName: 'Find Coupon',
  description: 'Find a Coupon',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single coupon from a WooCommerce store by its numeric coupon ID, including the discount type, amount, usage limits and restrictions. Use when an agent already has a coupon ID and needs the full coupon record. Read-only and idempotent.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findCouponOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'Enter the coupon ID',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const couponId = configValue.propsValue['id'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons/${couponId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
