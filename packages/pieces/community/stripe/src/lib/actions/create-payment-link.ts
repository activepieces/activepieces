import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';
import { Stripe } from 'stripe';

import { paymentLinkOutputSchema } from '../output-schemas';
export const stripeCreatePaymentLink = createAction({
  name: 'create_payment_link',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Payment Link',
  description: 'Create a shareable link where customers pay for set items.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a reusable, Stripe-hosted payment link for the given line items (price IDs and quantities), with optional after-completion redirect, promotion codes, and billing-address collection. Use to generate a shareable checkout URL without building a custom flow. Not idempotent: each call creates a new payment link.',
    idempotent: false,
  },
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'The prices and quantities buyers pay for.',
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
          required: true,
        }),
      },
    }),
    after_completion_type: Property.StaticDropdown({
      displayName: 'After Payment',
      required: false,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Thank-You Page',
            value: 'hosted_confirmation',
            description: "Stripe's page",
            icon: 'inbox',
          },
          {
            label: 'Redirect to URL',
            value: 'redirect',
            description: 'Your own page',
            icon: 'send',
          },
        ],
      },
    }),
    after_completion_redirect_url: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'Used only with Redirect to URL.',
      required: false,
      placeholder: 'https://example.com/thanks',
    }),
    allow_promotion_codes: Property.Checkbox({
      displayName: 'Allow Promotion Codes',
      description: 'Let buyers enter a promotion code at checkout.',
      required: false,
      advanced: true,
    }),
    billing_address_collection: Property.StaticDropdown({
      displayName: 'Billing Address',
      description: 'Auto asks only when Stripe needs it.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Required', value: 'required' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Extra key/value data to store on the link.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: paymentLinkOutputSchema,
  async run(context) {
    const client = getClient(context.auth.secret_text);
    const props = context.propsValue;

    if (
      props.after_completion_type === 'redirect' &&
      !props.after_completion_redirect_url
    ) {
      throw new Error('Add a Redirect URL, or choose Thank-You Page.');
    }

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
