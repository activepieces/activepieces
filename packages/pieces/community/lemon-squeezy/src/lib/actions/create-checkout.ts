import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lemonSqueezyAuth, LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders } from '../auth';

export const createCheckout = createAction({
  name: 'create_checkout',
  displayName: 'Create Checkout',
  description: 'Create a checkout URL for a specific Lemon Squeezy product variant.',
  auth: lemonSqueezyAuth,
  props: {
    storeId: Property.ShortText({
      displayName: 'Store ID',
      description: 'The ID of the store the checkout belongs to.',
      required: true,
    }),
    variantId: Property.ShortText({
      displayName: 'Variant ID',
      description: 'The ID of the product variant to create a checkout for.',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Pre-fill the customer email address on the checkout page.',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Pre-fill the customer name on the checkout page.',
      required: false,
    }),
    customPrice: Property.Number({
      displayName: 'Custom Price (cents)',
      description: 'Override the product price in the smallest currency unit (e.g. 999 = $9.99). Only works if custom prices are enabled on the variant.',
      required: false,
    }),
    discountCode: Property.ShortText({
      displayName: 'Discount Code',
      description: 'Pre-apply a discount code to the checkout.',
      required: false,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect the customer to after a successful purchase.',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'ISO 8601 datetime when this checkout URL expires (e.g. 2024-12-31T23:59:59Z). Leave empty for no expiry.',
      required: false,
    }),
    customData: Property.Json({
      displayName: 'Custom Data',
      description: 'Key-value pairs of custom data to attach to the order (accessible via webhooks).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build checkout_data — only include fields when both are present or individually provided
    const checkoutData: Record<string, unknown> = {};
    if (propsValue.customerEmail) checkoutData['email'] = propsValue.customerEmail;
    if (propsValue.customerName) checkoutData['name'] = propsValue.customerName;

    const checkoutOptions: Record<string, unknown> = {};
    if (propsValue.discountCode) checkoutOptions['discount'] = propsValue.discountCode;
    if (propsValue.redirectUrl) checkoutOptions['redirect_url'] = propsValue.redirectUrl;

    const attributes: Record<string, unknown> = {};

    if (Object.keys(checkoutData).length > 0) {
      attributes['checkout_data'] = checkoutData;
    }

    if (Object.keys(checkoutOptions).length > 0) {
      attributes['checkout_options'] = checkoutOptions;
    }

    if (propsValue.customPrice) {
      attributes['custom_price'] = propsValue.customPrice;
    }

    if (propsValue.expiresAt) {
      attributes['expires_at'] = propsValue.expiresAt;
    }

    if (propsValue.customData) {
      attributes['custom_data'] = propsValue.customData;
    }

    // NOTE: store_id and variant_id belong ONLY in relationships (not attributes)
    // per the Lemon Squeezy JSON:API spec. Relationship IDs must be strings.
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${LEMON_SQUEEZY_API_BASE}/checkouts`,
      headers: getLemonSqueezyHeaders(auth as string),
      body: {
        data: {
          type: 'checkouts',
          attributes,
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: String(propsValue.storeId),
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: String(propsValue.variantId),
              },
            },
          },
        },
      },
    });

    return response.body;
  },
});
