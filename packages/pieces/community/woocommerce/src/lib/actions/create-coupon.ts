import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
  propsValidation,
} from '@activepieces/pieces-common';
import { z } from 'zod';

import { wooAuth } from '../..';

export const wooCreateCoupon = createAction({
  name: 'Create Coupon',
  displayName: 'Create Coupon',
  description: 'Create a coupon',
  auth: wooAuth,
  props: {
    code: Property.ShortText({
      displayName: 'Coupon code',
      description: 'Enter the coupon code',
      required: true,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount type',
      description: 'Select the discount type',
      required: true,
      options: {
        options: [
          {
            label: 'Fixed cart',
            value: 'fixed_cart',
          },
          {
            label: 'Fixed product',
            value: 'fixed_product',
          },
          {
            label: 'Percent',
            value: 'percent',
          },
          {
            label: 'Percent product',
            value: 'percent_product',
          },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Enter the amount',
      required: true,
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum amount',
      description: 'Enter the minimum amount',
      required: true,
    }),
  },
  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      minimum_amount: z.number().min(0),
    });

    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '');
    const amount = configValue.propsValue['amount'] || 0;
    const code = configValue.propsValue['code'];
    const discount_type = configValue.propsValue['discount_type'];
    const minimum_amount = configValue.propsValue['minimum_amount'] || 0;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.consumerKey,
        password: configValue.auth.consumerSecret,
      },
      body: {
        code,
        discount_type,
        amount,
        individual_use: true,
        exclude_sale_items: true,
        minimum_amount,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
