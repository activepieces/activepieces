import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateCheckoutSession = createAction({
  name: 'create_checkout_session',
  auth: stripeAuth,
  displayName: 'Create Checkout Session (Agent)',
  description: 'Create a Stripe-hosted Checkout Session.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Stripe-hosted Checkout Session for one-time payment, subscription, or setup mode, with line items (price IDs + quantities) and success/cancel URLs. Richer than a payment link for one-off flows; for a reusable shareable URL use Create Payment Link. Not idempotent: each call creates a new session.',
    idempotent: false,
  },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'The Checkout mode.',
      required: true,
      options: {
        options: [
          { label: 'Payment (one-time)', value: 'payment' },
          { label: 'Subscription', value: 'subscription' },
          { label: 'Setup (save payment method)', value: 'setup' },
        ],
      },
    }),
    line_items: Property.Array({
      displayName: 'Line Items',
      description:
        'The prices and quantities. Required for payment and subscription modes.',
      required: false,
      properties: {
        price: Property.ShortText({
          displayName: 'Price ID',
          description: 'The price ID (e.g., price_...).',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: true,
        }),
      },
    }),
    success_url: Property.ShortText({
      displayName: 'Success URL',
      description: 'URL to redirect to after successful payment.',
      required: false,
    }),
    cancel_url: Property.ShortText({
      displayName: 'Cancel URL',
      description: 'URL to redirect to if the customer cancels.',
      required: false,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'An existing customer (cus_...) to associate with the session.',
      required: false,
    }),
  },
  async run(context) {
    const { mode, line_items, success_url, cancel_url, customer } =
      context.propsValue;

    const body: { [key: string]: unknown } = { mode };
    if (success_url) body.success_url = success_url;
    if (cancel_url) body.cancel_url = cancel_url;
    if (customer) body.customer = customer;

    if (line_items && Array.isArray(line_items)) {
      line_items.forEach((item, index) => {
        const typed = item as { price: string; quantity: number };
        body[`line_items[${index}][price]`] = typed.price;
        body[`line_items[${index}][quantity]`] = typed.quantity;
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/checkout/sessions`,
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
