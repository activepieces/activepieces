import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateSubscriptionAi = createAction({
  name: 'create_subscription_ai',
  auth: stripeAuth,
  displayName: 'Create Subscription (Agent)',
  description: 'Start a subscription for a customer with specified prices.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a recurring subscription for an existing customer against one or more price IDs, with optional collection method, trial period, and default payment method. Use to enroll a customer in recurring billing. Requires a customer ID and at least one price. Not idempotent: each call creates a separate subscription.',
    idempotent: false,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...). Obtain it from Search Customers or List Customers.',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Subscription Items',
      description: 'A list of prices to subscribe the customer to.',
      required: true,
      properties: {
        price: Property.ShortText({
          displayName: 'Price ID',
          description:
            'The price ID (e.g., price_...). Obtain it from List/Search Prices.',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Number of units of this price. Defaults to 1.',
          required: false,
        }),
      },
    }),
    collection_method: Property.StaticDropdown({
      displayName: 'Collection Method',
      description:
        "'charge_automatically' bills the default payment method; 'send_invoice' emails an invoice.",
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
        "Days before an invoice is due. Required if Collection Method is 'Send Invoice'.",
      required: false,
    }),
    trial_period_days: Property.Number({
      displayName: 'Trial Period (Days)',
      description:
        'Number of trial days before the subscription bills for the first time.',
      required: false,
    }),
    default_payment_method: Property.ShortText({
      displayName: 'Default Payment Method ID',
      description: 'ID of the default payment method (e.g., pm_...).',
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
