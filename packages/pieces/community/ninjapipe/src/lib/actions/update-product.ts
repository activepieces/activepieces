import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateProduct = createAction({
  auth: ninjapipeAuth,
  name: 'update_product',
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Updates a product. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'both',
  aiMetadata: {
    description: 'Update a NinjaPipe product by ID. Only filled fields change and Clear Fields empties fields. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.product,
  props: {
    productId: ninjapipeProps.productRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    sku: Property.ShortText({ displayName: 'SKU', required: false }),
    price: Property.Number({ displayName: 'Price', required: false }),
    cost: Property.Number({ displayName: 'Cost', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'ISO currency code, e.g. EUR.', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    clearFields: ninjapipeProps.clearFields({ fields: { sku: 'SKU', description: 'Description', currency: 'Currency', status: 'Status', category: 'Category' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/products/${ninjapipeClient.pathId({ value: p.productId, field: 'Product' })}`;
    const changes = ninjapipeFields.compact({
      name: p.name,
      sku: p.sku,
      price: ninjapipeFields.toNumber({ value: p.price, field: 'Price' }),
      cost: ninjapipeFields.toNumber({ value: p.cost, field: 'Cost' }),
      description: p.description,
      currency: p.currency,
      status: p.status,
      category: p.category,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'product' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update product' });
  },
});
