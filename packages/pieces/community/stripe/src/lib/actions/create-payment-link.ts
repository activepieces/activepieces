import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

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
    const {
      line_items,
      after_completion_type,
      after_completion_redirect_url,
      ...props
    } = context.propsValue;

    const body: { [key: string]: unknown } = { ...props };

    if (line_items && Array.isArray(line_items)) {
      line_items.forEach((item, index) => {
        const typedItem = item as { price: string; quantity: number };
        body[`line_items[${index}][price]`] = typedItem.price;
        body[`line_items[${index}][quantity]`] = typedItem.quantity;
      });
    }

    if (after_completion_type) {
      body['after_completion[type]'] = after_completion_type;
      if (
        after_completion_type === 'redirect' &&
        after_completion_redirect_url
      ) {
        body['after_completion[redirect][url]'] = after_completion_redirect_url;
      }
    }

    if (props.metadata && typeof props.metadata === 'object') {
      Object.keys(props.metadata).forEach((key) => {
        body[`metadata[${key}]`] = (props.metadata as Record<string, string>)[
          key
        ];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_links`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: body,
    });

    return response.body;
  },
});
