import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { subscriptionOutputSchema } from '../output-schemas';
export const stripeCreateSubscription = createAction({
  name: 'create_subscription',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Subscription',
  description: 'Subscribe a customer to one or more prices.',
  audience: 'human',
  aiMetadata: {
    description:
      'Starts a recurring subscription for an existing customer against one or more price IDs, with optional collection method, trial period, and default payment method. Use to enroll a customer in recurring billing. Requires a customer ID and at least one price; not idempotent, as each call creates a separate subscription.',
    idempotent: false,
  },
  props: {
    customer: stripeCommon.customer,
    items: Property.Array({
      displayName: 'Items',
      description: 'The prices to subscribe the customer to.',
      required: true,
      properties: {
        price: Property.ShortText({
          displayName: 'Price ID',
          description:
            'Starts with price_. Find it under Product catalog in Stripe.',
          required: true,
          placeholder: 'price_...',
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Units of this price. Defaults to 1.',
          required: false,
        }),
      },
    }),
    collection_method: Property.StaticDropdown({
      displayName: 'Collection Method',
      required: false,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Auto-Charge',
            value: 'charge_automatically',
            description: 'Payment on file',
            icon: 'tag',
          },
          {
            label: 'Send Invoice',
            value: 'send_invoice',
            description: 'Emailed to pay',
            icon: 'send',
          },
        ],
      },
    }),
    days_until_due: Property.Number({
      displayName: 'Days Until Due',
      description: 'Days the customer has to pay. Needed for Send Invoice.',
      required: false,
    }),
    trial_period_days: Property.Number({
      displayName: 'Trial Days',
      description: 'Free days before the first bill.',
      required: false,
      display: 'stepper',
      min: 1,
      max: 730,
      step: 1,
    }),
    default_payment_method: Property.ShortText({
      displayName: 'Default Payment Method ID',
      description: "Starts with pm_. Empty uses the customer's default.",
      required: false,
      advanced: true,
      placeholder: 'pm_...',
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Extra key/value data to store on the subscription.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: subscriptionOutputSchema,
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

    if (collection_method === 'send_invoice' && isNil(days_until_due)) {
      throw new Error('Add Days Until Due, or choose Auto-Charge.');
    }

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
      body: stripeCommon.toFormBody(body),
    });

    return response.body;
  },
});
