import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { isoDateOrUndefined, lsRequest, numericId } from '../common/client';
import { storeOptions, productOptions, variantOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const createCheckout = createAction({
  name: 'create_checkout',
  classification: 'WRITE',
  displayName: 'Create Checkout',
  description: 'Create a checkout URL for a specific Lemon Squeezy product variant.',
  audience: 'both',
  aiMetadata: { description: 'Create a hosted Lemon Squeezy checkout URL for a given store and product variant, optionally pre-filling customer email/name, applying a discount code, overriding the price, attaching custom data, or setting a redirect and expiry. Use to generate a payable link to send a customer. Not idempotent: each call creates a new checkout, so repeated calls yield distinct URLs. Requires a store and variant ID.', idempotent: false },
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.checkout,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'The store the checkout belongs to.',
      required: true,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => storeOptions({ auth }),
    }),
    productId: Property.Dropdown({
      displayName: 'Product',
      description: 'Select a product to filter the variant list below.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'storeId'],
      options: async ({ auth, storeId }) => productOptions({ auth, storeId }),
    }),
    variantId: Property.Dropdown({
      displayName: 'Variant',
      description: 'The product variant to create a checkout for.',
      required: true,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'productId'],
      options: async ({ auth, productId }) => variantOptions({ auth, productId }),
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
    const storeId = numericId({ value: propsValue.storeId, label: 'Store' });
    const variantId = numericId({ value: propsValue.variantId, label: 'Variant' });
    const expiresAt = isoDateOrUndefined({ value: propsValue.expiresAt, label: 'Expires At' });

    const customData = propsValue.customData;
    if (customData !== undefined && customData !== null && (typeof customData !== 'object' || Array.isArray(customData))) {
      throw new Error('Custom Data must be a JSON object of key-value pairs, for example {"user_id": "123"}.');
    }
    const customPrice = propsValue.customPrice;
    if (customPrice !== undefined && customPrice !== null && (!Number.isInteger(Number(customPrice)) || Number(customPrice) < 0)) {
      throw new Error('Custom Price must be a whole number of cents (0 or more).');
    }

    const checkoutData: Record<string, unknown> = {};
    if (propsValue.customerEmail) checkoutData['email'] = propsValue.customerEmail;
    if (propsValue.customerName) checkoutData['name'] = propsValue.customerName;
    if (propsValue.discountCode) checkoutData['discount_code'] = propsValue.discountCode;
    if (customData && Object.keys(customData).length > 0) checkoutData['custom'] = customData;

    const attributes: Record<string, unknown> = {};
    if (Object.keys(checkoutData).length > 0) attributes['checkout_data'] = checkoutData;
    if (propsValue.redirectUrl) attributes['product_options'] = { redirect_url: propsValue.redirectUrl };
    if (customPrice !== undefined && customPrice !== null) attributes['custom_price'] = Number(customPrice);
    if (expiresAt) attributes['expires_at'] = expiresAt;

    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'POST',
      path: '/checkouts',
      body: {
        data: {
          type: 'checkouts',
          attributes,
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      },
    });

    return response.body;
  },
});
