import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeSchemas } from '../output-schemas';

export const createProduct = createAction({
  auth: ninjapipeAuth,
  name: 'create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Creates a product.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a NinjaPipe product. Required: name. Not idempotent: each call creates another product.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.product,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    sku: Property.ShortText({ displayName: 'SKU', required: false }),
    price: Property.Number({ displayName: 'Price', required: false }),
    cost: Property.Number({ displayName: 'Cost', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'ISO currency code, e.g. EUR.', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      sku: p.sku,
      price: ninjapipeFields.toNumber({ value: p.price, field: 'Price' }),
      cost: ninjapipeFields.toNumber({ value: p.cost, field: 'Cost' }),
      description: p.description,
      currency: p.currency,
      status: p.status,
      category: p.category,
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/products',
      body,
      operation: 'create product',
    });
  },
});
