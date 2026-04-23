import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const updateProduct = createAction({
  auth: ninjapipeAuth,
  name: 'update_product',
  displayName: 'Update Product',
  description: 'Updates a product by ID.',
  props: {
    productId: Property.ShortText({ displayName: 'Product ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    sku: Property.ShortText({ displayName: 'SKU', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    price: Property.Number({ displayName: 'Price', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.sku) body.sku = p.sku;
    if (p.description) body.description = p.description;
    if (p.price !== undefined) body.price = p.price;
    if (p.currency) body.currency = p.currency;
    if (p.status) body.status = p.status;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.PUT, path: `/products/${p.productId}`, body });
    return flattenCustomFields(response.body);
  },
});
