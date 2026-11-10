import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { wooPathId } from '../common/path-id';
import { updateCouponOutputSchema } from '../output-schemas';

export const wooUpdateCoupon = createAction({
  name: 'Update Coupon',
  classification: 'WRITE',
  displayName: 'Update Coupon',
  description: 'Update a coupon amount, description, expiry or usage limit',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce coupon by ID. Can change the discount amount and type, description, expiry date, usage limit and minimum spend. Only the fields provided are changed. Idempotent: sending the same values twice leaves the coupon in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCouponOutputSchema,
  propertyGroups: [
    {
      key: 'coupon',
      display: 'section',
      label: 'Coupon to Update',
      icon: 'tag',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'amount',
        'discount_type',
        'minimum_amount',
        'usage_limit',
        'date_expires',
        'description',
      ],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'Find it in WooCommerce under Marketing > Coupons.',
      placeholder: '123',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: "Discount size, as a percent or in your store's currency.",
      required: false,
      width: 'half',
    }),
    discount_type: Property.StaticDropdown({
      displayName: 'Discount Type',
      description: 'Percentage uses Amount as a percent; the fixed types as money.',
      required: false,
      width: 'half',
      options: {
        options: [
          { label: 'Percentage', value: 'percent' },
          { label: 'Fixed cart', value: 'fixed_cart' },
          { label: 'Fixed product', value: 'fixed_product' },
        ],
      },
    }),
    minimum_amount: Property.Number({
      displayName: 'Minimum Spend',
      description: 'Smallest order total the coupon works on.',
      required: false,
      width: 'half',
    }),
    usage_limit: Property.Number({
      displayName: 'Usage Limit',
      description: 'How many times the coupon can be used in total.',
      required: false,
      width: 'half',
    }),
    date_expires: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'The coupon stops working after this date.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal note shown only in WooCommerce admin.',
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
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons/${wooPathId.encode({ id, label: 'Coupon ID' })}`,
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
