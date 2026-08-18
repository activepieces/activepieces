import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { promotionCodeListOutputSchema } from '../output-schemas';
export const stripeListPromotionCodes = createAction({
  name: 'list_promotion_codes',
  auth: stripeAuth,
  displayName: 'List Promotion Codes (Agent)',
  description: 'List Stripe promotion codes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through promotion codes, optionally filtered by coupon, active state, or the literal code string. Use to enumerate codes or resolve an ID; use Get Promotion Code when you have the promo_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    coupon: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'Filter to codes for this coupon.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Active',
      required: false,
      options: {
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Inactive only', value: 'false' },
        ],
      },
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'Filter to the literal code string (e.g., SUMMER25).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: promotionCodeListOutputSchema,
  async run(context) {
    const { coupon, active, code, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (coupon) queryParams['coupon'] = coupon;
    if (active) queryParams['active'] = active;
    if (code) queryParams['code'] = code;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/promotion_codes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
