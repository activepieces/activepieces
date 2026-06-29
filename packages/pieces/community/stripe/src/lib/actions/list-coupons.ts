import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListCoupons = createAction({
  name: 'list_coupons',
  auth: stripeAuth,
  displayName: 'List Coupons (Agent)',
  description: 'List Stripe coupons.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through coupons, newest first. Use to enumerate coupons or resolve a coupon ID; use Get Coupon when you have the ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/coupons`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
