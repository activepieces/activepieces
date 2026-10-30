import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps, storeDropdown } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listLicenseKeys = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_license_keys',
  displayName: 'List License Keys',
  description: 'List license keys, filtered by store, order or product.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy license keys (full key included), optionally filtered by store, order ID, order item ID or product ID, with page-based pagination. Use Get License Key to look up a single key string. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.licenseKey, itemLabel: 'key_short' }),
  props: {
    storeId: storeDropdown({ required: false, description: 'Filter by store. Leave empty to include every store the API key can see.' }),
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Only keys from this order.',
      required: false,
    }),
    orderItemId: Property.ShortText({
      displayName: 'Order Item ID',
      description: 'Only keys from this order item.',
      required: false,
    }),
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'Only keys for this product.',
      required: false,
    }),
    ...pageProps('license keys'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/license-keys',
      query: {
        'filter[store_id]': optionalId({ value: propsValue.storeId, label: 'Store' }),
        'filter[order_id]': optionalId({ value: propsValue.orderId, label: 'Order ID' }),
        'filter[order_item_id]': optionalId({ value: propsValue.orderItemId, label: 'Order Item ID' }),
        'filter[product_id]': optionalId({ value: propsValue.productId, label: 'Product ID' }),
        ...pageParams(propsValue),
      },
    });
  },
});
