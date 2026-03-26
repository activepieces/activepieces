import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const updateProductAction = createAction({
  name: 'update_product',
  displayName: 'Update Product',
  description: 'Updates a product\'s details (name, price, description, status).',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Draft', value: 'draft' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('products/update', {
      productId: context.propsValue.productId,
      name: context.propsValue.name,
      description: context.propsValue.description,
      price: context.propsValue.price,
      status: context.propsValue.status,
    });
  },
});
