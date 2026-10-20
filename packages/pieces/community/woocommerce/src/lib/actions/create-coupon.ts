import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
  propsValidation,
} from '@activepieces/pieces-common';
import * as z from 'zod/mini'

import { wooAuth } from '../auth';
import { createCouponOutputSchema } from '../output-schemas';

export const wooCreateCoupon = createAction({
  name: 'Create Coupon',
  classification: 'WRITE',
  displayName: 'Create Coupon',
  description: 'Create a discount coupon customers can use at checkout',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new discount coupon in a WooCommerce store with a code, discount type (fixed_cart, fixed_product, or percent), amount, and optional minimum order amount. Use when an agent needs to issue a promotional or discount code. Not idempotent: each call posts a new coupon, and the code must be unique in the store.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createCouponOutputSchema,
  propertyGroups: [
    {
      key: 'coupon',
      display: 'section',
      label: 'Coupon',
      icon: 'tag',
      props: ['code', 'discount_type'],
    },
    {
      key: 'discount',
      display: 'section',
      label: 'Discount',
      icon: 'sliders',
      props: ['coupon_rules', 'amount', 'minimum_amount'],
    },
  ],
  props: {
    code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'The code customers type at checkout.',
      placeholder: 'SUMMER25',
      required: true,
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'Percentage uses Amount as a percent; the fixed types as money.',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Percentage',
            value: 'percent',
            icon: 'sliders',
          },
          {
            label: 'Fixed cart',
            value: 'fixed_cart',
            icon: 'inbox',
          },
          {
            label: 'Fixed product',
            value: 'fixed_product',
            icon: 'tag',
          },
        ],
      },
    }),
    coupon_rules: Property.MarkDown({
      value:
        "Coupons created here can't be combined with other coupons and don't apply to items on sale.",
      variant: MarkdownVariant.INFO,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: "Discount size, as a percent or in your store's currency.",
      required: true,
      width: 'half',
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum Spend',
      description: 'Smallest order total the coupon works on. Empty: no minimum.',
      required: false,
      width: 'half',
    }),
  },
  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      minimum_amount: z.nullish(z.number().check(z.minimum(0))),
    });

    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const amount = configValue.propsValue['amount'] || 0;
    const code = configValue.propsValue['code'];
    const discount_type = configValue.propsValue['discount_type'];
    const minimum_amount = configValue.propsValue['minimum_amount'];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body: {
        code,
        discount_type,
        amount,
        individual_use: true,
        exclude_sale_items: true,
        ...(minimum_amount === undefined || minimum_amount === null
          ? {}
          : { minimum_amount }),
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
