import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const createProduct = createAction({
  auth: ninjapipeAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Creates a new product.',
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Product name.', required: true }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU. Must be unique within your workspace.',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price.',
      required: true,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = {};
    if (p.name) body['name'] = p.name;
    if (p.sku) body['sku'] = p.sku;
    if (p.description) body['description'] = p.description;
    if (p.price !== undefined) body['price'] = p.price;
    if (p.currency) body['currency'] = p.currency;
    if (p.status) body['status'] = p.status;
    if (p.customFields && typeof p.customFields === 'object') body['custom_fields'] = p.customFields;
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.POST, path: '/products', body });
    return flattenCustomFields(response.body);
  },
});
