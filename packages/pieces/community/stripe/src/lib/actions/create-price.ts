import { stripeAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { productidDropdown } from '../common';

export const createPrice = createAction({
  auth: stripeAuth,
  name: 'createPrice',
  displayName: 'Create Price',
  description: 'Create a new price for a Stripe product.',
  props: {
    product: productidDropdown,
    unit_amount: Property.Number({
      displayName: 'Unit Amount (in cents)',
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
      displayName: 'Recurring Interval Count',
      required: false,
      defaultValue: 1,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the price.',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      product,
      unit_amount,
      currency,
      recurring_interval,
      recurring_interval_count,
      nickname,
      metadata,
    } = propsValue;

    const body: Record<string, any> = {
      product,
      unit_amount,
      currency,
      nickname,
    };

    if (recurring_interval) {
      body['recurring[interval]'] = recurring_interval;
    }
    if (recurring_interval_count) {
      body['recurring[interval_count]'] = recurring_interval_count;
    }
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
    }

    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/prices',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});