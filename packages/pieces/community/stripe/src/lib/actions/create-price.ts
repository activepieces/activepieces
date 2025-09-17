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
    currency: Property.ShortText({
      displayName: 'Currency',
      required: true,
      defaultValue: 'usd',
    }),
    recurring_interval: Property.ShortText({
      displayName: 'Recurring Interval',
      required: false,
      defaultValue: 'month',
      description: 'One of day, week, month, or year.',
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