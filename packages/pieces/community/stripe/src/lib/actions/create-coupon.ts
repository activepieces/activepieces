import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { couponOutputSchema } from '../output-schemas';
export const stripeCreateCoupon = createAction({
  name: 'create_coupon',
  auth: stripeAuth,
  displayName: 'Create Coupon (Agent)',
  description: 'Create a discount coupon.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a discount coupon — either percent_off or amount_off (the latter requires a currency), with a duration of once, repeating (with duration_in_months), or forever. To expose it to customers wrap it in a Promotion Code. Not idempotent: each call creates a new coupon, and supplying a duplicate stable id returns a 409.',
    idempotent: false,
  },
  props: {
    percent_off: Property.Number({
      displayName: 'Percent Off',
      description: 'Percentage discount (e.g., 25 for 25%). Use this OR Amount Off.',
      required: false,
    }),
    amount_off: Property.Number({
      displayName: 'Amount Off',
      description:
        'Flat discount in the smallest currency unit (e.g., 500 for $5.00). Requires Currency.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter ISO currency code. Required with Amount Off.',
      required: false,
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'How long the discount applies.',
      required: true,
      options: {
        options: [
          { label: 'Once', value: 'once' },
          { label: 'Repeating', value: 'repeating' },
          { label: 'Forever', value: 'forever' },
        ],
      },
    }),
    duration_in_months: Property.Number({
      displayName: 'Duration in Months',
      description: 'Number of months the discount lasts. Required if duration is repeating.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name shown to customers on invoices/receipts.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'ID',
      description:
        'A custom unique coupon ID. If omitted, Stripe generates one. Reusing an existing id returns an error.',
      required: false,
    }),
  },
  outputSchema: couponOutputSchema,
  async run(context) {
    const {
      percent_off,
      amount_off,
      currency,
      duration,
      duration_in_months,
      name,
      id,
    } = context.propsValue;

    const body: { [key: string]: unknown } = { duration };
    if (percent_off !== undefined && percent_off !== null) {
      body.percent_off = percent_off;
    }
    if (amount_off !== undefined && amount_off !== null) {
      body.amount_off = amount_off;
    }
    if (currency) body.currency = currency;
    if (duration_in_months !== undefined && duration_in_months !== null) {
      body.duration_in_months = duration_in_months;
    }
    if (name) body.name = name;
    if (id) body.id = id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/coupons`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
