import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { promotionCodeOutputSchema } from '../output-schemas';
export const stripeCreatePromotionCode = createAction({
  name: 'create_promotion_code',
  auth: stripeAuth,
  displayName: 'Create Promotion Code (Agent)',
  description: 'Create a customer-facing promotion code for a coupon.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a customer-facing promotion code that maps to an existing coupon, with optional custom code string, customer restriction, max redemptions, and expiry. Create the coupon first with Create Coupon. Not idempotent: each call creates a new promotion code.',
    idempotent: false,
  },
  props: {
    coupon: Property.ShortText({
      displayName: 'Coupon ID',
      description:
        'The coupon ID this promotion code applies. Obtain it from List Coupons or Create Coupon.',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description:
        'The customer-facing code (e.g., SUMMER25). If omitted, Stripe generates one.',
      required: false,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Restrict the code to this customer (cus_...).',
      required: false,
    }),
    max_redemptions: Property.Number({
      displayName: 'Max Redemptions',
      description: 'Maximum number of times the code can be redeemed.',
      required: false,
    }),
    expires_at: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the promotion code expires.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
    }),
  },
  outputSchema: promotionCodeOutputSchema,
  async run(context) {
    const { coupon, code, customer, max_redemptions, expires_at, active } =
      context.propsValue;

    const body: { [key: string]: unknown } = { coupon };
    if (code) body.code = code;
    if (customer) body.customer = customer;
    if (max_redemptions !== undefined && max_redemptions !== null) {
      body.max_redemptions = max_redemptions;
    }
    if (expires_at) {
      body.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
    }
    if (active !== undefined) body.active = active;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/promotion_codes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-05-28.basil',
      },
      body,
    });

    return response.body;
  },
});
