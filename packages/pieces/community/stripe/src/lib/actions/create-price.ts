import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreatePrice = createAction({
  name: 'create_price',
  auth: stripeAuth,
  displayName: 'Create Price',
  description:
    'Create a price (one-time or recurring), associated with a product.',
  props: {
    product: stripeCommon.product, 
    unit_amount: Property.Number({
      displayName: 'Unit Amount',
      description:
        'The price amount as a decimal, for example, 25.50 for $25.50.',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The three-letter ISO code for the currency.',
      required: true,
      options: {
        options: [
          { label: 'US Dollar', value: 'usd' },
          { label: 'Euro', value: 'eur' },
          { label: 'Pound Sterling', value: 'gbp' },
          { label: 'Indian Rupee', value: 'inr' },
          { label: 'Australian Dollar', value: 'aud' },
          { label: 'Canadian Dollar', value: 'cad' },
          { label: 'Swiss Franc', value: 'chf' },
          { label: 'Chinese Yuan', value: 'cny' },
          { label: 'Japanese Yen', value: 'jpy' },
          { label: 'Singapore Dollar', value: 'sgd' },
        ],
      },
    }),
    recurring_interval: Property.StaticDropdown({
      displayName: 'Billing Interval',
      description:
        "Specify the billing frequency. Select 'One-Time' for a single, non-recurring payment.",
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
        'The number of intervals between subscription billings (e.g., for billing every 3 months, set Interval to Monthly and Interval Count to 3). Only used for recurring prices.',
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
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
