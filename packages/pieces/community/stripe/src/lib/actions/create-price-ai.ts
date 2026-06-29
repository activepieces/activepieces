import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreatePriceAi = createAction({
  name: 'create_price_ai',
  auth: stripeAuth,
  displayName: 'Create Price (Agent)',
  description: 'Create a one-time or recurring price for a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a price for an existing Stripe product, one-time or recurring depending on the chosen billing interval. Amount is a decimal in the major currency unit. Use after Create Product to define what to charge before building a subscription or payment link. Requires the product ID. Not idempotent: each call creates a new price.',
    idempotent: false,
  },
  props: {
    product: Property.ShortText({
      displayName: 'Product ID',
      description:
        'The Stripe product ID (e.g., prod_...) this price attaches to. Obtain it from List/Search Products or Create Product.',
      required: true,
    }),
    unit_amount: Property.Number({
      displayName: 'Unit Amount',
      description: 'The price amount as a decimal (e.g., 25.50 for $25.50).',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., usd).',
      required: true,
    }),
    recurring_interval: Property.StaticDropdown({
      displayName: 'Billing Interval',
      description:
        "Billing frequency. Select 'One-Time' for a single, non-recurring payment.",
      required: true,
      defaultValue: 'one_time',
      options: {
        options: [
          { label: 'One-Time', value: 'one_time' },
          { label: 'Daily', value: 'day' },
          { label: 'Weekly', value: 'week' },
          { label: 'Monthly', value: 'month' },
          { label: 'Yearly', value: 'year' },
        ],
      },
    }),
    recurring_interval_count: Property.Number({
      displayName: 'Interval Count',
      description:
        'Number of intervals between billings (e.g., Monthly + count 3 = every 3 months). Only used for recurring prices.',
      required: false,
    }),
  },
  async run(context) {
    const {
      product,
      unit_amount,
      currency,
      recurring_interval,
      recurring_interval_count,
    } = context.propsValue;

    const unitAmountInCents = Math.round(unit_amount * 100);

    const body: { [key: string]: unknown } = {
      product: product,
      unit_amount: unitAmountInCents,
      currency: currency,
    };

    if (recurring_interval !== 'one_time') {
      body['recurring[interval]'] = recurring_interval;
      if (recurring_interval_count) {
        body['recurring[interval_count]'] = recurring_interval_count;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/prices`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
