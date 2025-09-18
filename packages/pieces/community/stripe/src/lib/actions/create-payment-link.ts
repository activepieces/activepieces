import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';
import { Stripe } from 'stripe';

export const stripeCreatePaymentLink = createAction({
  name: 'create_payment_link',
  auth: stripeAuth,
  displayName: 'Create Payment Link',
  description:
    'Creates a shareable, Stripe-hosted payment link for one-time purchases or subscriptions.',
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      description:
        'The products and quantities to include in the payment link.',
      required: true,
      properties: {
        price: Property.ShortText({
          displayName: 'Price ID',
          description:
            'The ID of the price object (e.g., price_1J2X3Y4Z...). Find this in your Stripe Dashboard under Products.',
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
        "Controls the behavior after the purchase is complete. Defaults to showing Stripe's hosted confirmation page.",
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
        'The URL to redirect the customer to after a successful purchase. Only used if the behavior is set to "Redirect to URL".',
      required: false,
    }),
    allow_promotion_codes: Property.Checkbox({
      displayName: 'Allow Promotion Codes',
      description:
        'Enables the user to enter a promotion code on the Payment Link page.',
      required: false,
    }),
    billing_address_collection: Property.StaticDropdown({
      displayName: 'Billing Address Collection',
      description:
        'Describes whether Checkout should collect the customer’s billing address.',
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
    const client = getClient(context.auth);
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
