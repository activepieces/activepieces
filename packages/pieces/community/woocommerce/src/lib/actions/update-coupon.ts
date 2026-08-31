import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { updateCouponOutputSchema } from '../output-schemas';

export const wooUpdateCoupon = createAction({
  name: 'Update Coupon',
  classification: 'WRITE',
  displayName: 'Update Coupon',
  description: 'Update a coupon amount, description, expiry or usage limit',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce coupon by ID. Can change the discount amount and type, description, expiry date, usage limit and minimum spend. Only the fields provided are changed. Idempotent: sending the same values twice leaves the coupon in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCouponOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'Enter the coupon ID',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount Type',
      required: false,
      options: {
        options: [
          { label: 'Percentage discount', value: 'percent' },
          { label: 'Fixed cart discount', value: 'fixed_cart' },
          { label: 'Fixed product discount', value: 'fixed_product' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    date_expires: Property.DateTime({
      displayName: 'Expires At',
      description: 'Date the coupon stops working',
      required: false,
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      required: false,
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum Spend',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, amount, discount_type, description, date_expires, usage_limit, minimum_amount } =
      configValue.propsValue;

    const body: Record<string, unknown> = {};
    if (amount !== undefined && amount !== null) {
      body['amount'] = String(amount);
    }
    if (discount_type) {
      body['discount_type'] = discount_type;
    }
    if (description) {
      body['description'] = description;
    }
    if (date_expires) {
      body['date_expires'] = date_expires;
    }
    if (usage_limit !== undefined && usage_limit !== null) {
      body['usage_limit'] = usage_limit;
    }
    if (minimum_amount !== undefined && minimum_amount !== null) {
      body['minimum_amount'] = String(minimum_amount);
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons/${id}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
