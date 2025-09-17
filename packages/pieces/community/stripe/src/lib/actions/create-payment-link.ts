import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const createPaymentLink = createAction({
  auth: stripeAuth,
  name: 'createPaymentLink',
  displayName: 'Create Payment Link',
  description: 'Create a payment link for a Stripe product or price.',
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      required: true,
      description: 'List of line items (price and quantity).',
      properties: {
        price: Property.ShortText({ displayName: 'Price ID', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: true }),
      },
    }),
    after_completion_type: Property.ShortText({
      displayName: 'After Completion Type',
      required: false,
      description:
        'Type of behavior after completion (redirect, hosted_confirmation, etc).',
    }),
    after_completion_redirect_url: Property.ShortText({
      displayName: 'After Completion Redirect URL',
      required: false,
      description: 'URL to redirect to after completion (if type is redirect).',
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the payment link.',
    }),
  },
  async run({ auth, propsValue }) {
    const {
      line_items,
      after_completion_type,
      after_completion_redirect_url,
      metadata,
    } = propsValue;

    const body: Record<string, any> = {};

    // Handle line_items array for Stripe API
    if (line_items && Array.isArray(line_items)) {
      line_items.forEach((item, idx: number) => {
        const typedItem = item as { price: string; quantity: number };
        body[`line_items[${idx}][price]`] = typedItem.price;
        body[`line_items[${idx}][quantity]`] = typedItem.quantity;
      });
    }

    // Handle after_completion
    if (after_completion_type) {
      body['after_completion[type]'] = after_completion_type;
      if (
        after_completion_type === 'redirect' &&
        after_completion_redirect_url
      ) {
        body['after_completion[redirect][url]'] = after_completion_redirect_url;
      }
    }

    // Handle metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
    }

    // Remove undefined values
    Object.keys(body).forEach(
      (key) => body[key] === undefined && delete body[key]
    );

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/payment_links',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
