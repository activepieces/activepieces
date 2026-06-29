import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';
import { Stripe } from 'stripe';

export const stripeCreatePaymentLinkAi = createAction({
  name: 'create_payment_link_ai',
  auth: stripeAuth,
  displayName: 'Create Payment Link (Agent)',
  description: 'Create a shareable, Stripe-hosted payment link.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a reusable, Stripe-hosted payment link for the given line items (price IDs and quantities), with optional after-completion redirect, promotion codes, and billing-address collection. Use to generate a shareable checkout URL without building a custom flow; for a richer one-off hosted page use Create Checkout Session. Not idempotent: each call creates a new payment link.',
    idempotent: false,
  },
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'The products and quantities to include in the payment link.',
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
          required: true,
        }),
      },
    }),
    after_completion_type: Property.StaticDropdown({
      displayName: 'After Completion Behavior',
      description:
        "Behavior after purchase completes. Defaults to Stripe's hosted confirmation page.",
      required: false,
      options: {
        options: [
          { label: 'Show Confirmation Page', value: 'hosted_confirmation' },
          { label: 'Redirect to URL', value: 'redirect' },
        ],
      },
    }),
    after_completion_redirect_url: Property.ShortText({
      displayName: 'Redirect URL',
      description:
        'URL to redirect to after a successful purchase. Only used when behavior is "Redirect to URL".',
      required: false,
    }),
    allow_promotion_codes: Property.Checkbox({
      displayName: 'Allow Promotion Codes',
      description: 'Allow the customer to enter a promotion code.',
      required: false,
    }),
    billing_address_collection: Property.StaticDropdown({
      displayName: 'Billing Address Collection',
      description: "Whether Checkout collects the customer's billing address.",
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Required', value: 'required' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const client = getClient(context.auth.secret_text);
    const props = context.propsValue;

    const params: Stripe.PaymentLinkCreateParams = {
      line_items: props.line_items as { price: string; quantity: number }[],
      allow_promotion_codes: props.allow_promotion_codes,
      billing_address_collection: props.billing_address_collection as
        | 'auto'
        | 'required'
        | undefined,
      metadata: props.metadata as Record<string, string> | undefined,
    };

    if (props.after_completion_type) {
      params.after_completion = {
        type: props.after_completion_type as 'hosted_confirmation' | 'redirect',
      };
      if (
        props.after_completion_type === 'redirect' &&
        props.after_completion_redirect_url
      ) {
        params.after_completion.redirect = {
          url: props.after_completion_redirect_url,
        };
      }
    }

    return await client.paymentLinks.create(params);
  },
});
