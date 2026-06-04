import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { qawafelProps } from '../common/props';

export const updateProduct = createAction({
  auth: qawafelAuth,
  name: 'update_product',
  displayName: 'Update Product',
  description:
    "Edit a product's price, description, or active state. Only the fields you fill in are updated — leave the rest blank to keep them unchanged.",
  props: {
    product_id: qawafelProps.productDropdown({
      displayName: 'Product to update',
      description:
        'Pick the product you want to change. Only the 100 most recent products are listed — use "List Products" if you need to find an older one.',
      required: true,
    }),
    unit_price: Property.ShortText({
      displayName: 'New Unit Price (SAR)',
      description:
        'Optional. New price per unit as a decimal string, e.g. `129.00`. Leave blank to keep the current price.',
      required: false,
    }),
    description_en: Property.LongText({
      displayName: 'New Description (English)',
      description:
        'Optional. New English description. Leave blank to keep the current one.',
      required: false,
    }),
    description_ar: Property.LongText({
      displayName: 'New Description (Arabic)',
      description:
        'Optional. New Arabic description. Leave blank to keep the current one.',
      required: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Optional. Tick to keep the product active, untick to soft-disable. Leave blank to keep the current value.',
      required: false,
    }),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.unit_price !== undefined) {
      body['unit_price'] = propsValue.unit_price;
    }
    if (propsValue.description_en !== undefined) {
      body['description_en'] = propsValue.description_en;
    }
    if (propsValue.description_ar !== undefined) {
      body['description_ar'] = propsValue.description_ar;
    }
    if (propsValue.is_active !== undefined) {
      body['is_active'] = propsValue.is_active;
    }

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.PATCH,
      path: `/products/${propsValue.product_id}`,
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
