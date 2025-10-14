import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateSubscription = createAction({
  name: 'create_subscription',
  auth: stripeAuth,
  displayName: 'Create Subscription',
  description:
    'Start a subscription for a customer with specified items/prices.',
  props: {
    customer: stripeCommon.customer,
    items: Property.Array({
      displayName: 'Subscription Items',
      description: 'A list of prices to subscribe the customer to.',
      required: true,
      properties: {
        price: Property.ShortText({
          displayName: 'Price ID',
          description:
            'The ID of the price object (e.g., price_...). You can find this in your Stripe Dashboard under Products.',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description:
            'The number of units of this price to subscribe to. Defaults to 1.',
          required: false,
        }),
      },
    }),
    collection_method: Property.StaticDropdown({
      displayName: 'Collection Method',
      description:
        "How to collect payment. 'charge_automatically' will try to bill the default payment method. 'send_invoice' will email an invoice.",
      required: false,
      options: {
        options: [
          { label: 'Charge Automatically', value: 'charge_automatically' },
          { label: 'Send Invoice', value: 'send_invoice' },
        ],
      },
    }),
    days_until_due: Property.Number({
      displayName: 'Days Until Due',
      description:
        "Number of days before an invoice is due. Required if Collection Method is 'Send Invoice'.",
      required: false,
    }),
    trial_period_days: Property.Number({
      displayName: 'Trial Period (Days)',
      description:
        'Integer representing the number of trial days the customer receives before the subscription bills for the first time.',
      required: false,
    }),
    default_payment_method: Property.ShortText({
      displayName: 'Default Payment Method ID',
      description:
        'ID of the default payment method for the subscription (e.g., `pm_...`).',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const {
      customer,
      items,
      collection_method,
      days_until_due, 
      trial_period_days,
      default_payment_method,
      metadata,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      customer,
      collection_method,
      days_until_due, 
      trial_period_days,
      default_payment_method,
      metadata,
    };

    Object.keys(body).forEach((key) => {
      if (body[key] === undefined || body[key] === null) {
        delete body[key];
      }
    });

    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        const typedItem = item as { price: string; quantity?: number };
        body[`items[${index}][price]`] = typedItem.price;
        if (typedItem.quantity) {
          body[`items[${index}][quantity]`] = typedItem.quantity;
        }
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/subscriptions`,
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
