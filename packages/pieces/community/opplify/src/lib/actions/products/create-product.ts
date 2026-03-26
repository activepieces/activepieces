import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const createProductAction = createAction({
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Creates a new product in your catalog.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Price in your default currency',
      required: true,
    }),
    productType: Property.StaticDropdown({
      displayName: 'Product Type',
      required: false,
      defaultValue: 'service',
      options: {
        disabled: false,
        options: [
          { label: 'Digital', value: 'digital' },
          { label: 'Physical', value: 'physical' },
          { label: 'Service', value: 'service' },
          { label: 'Consultation', value: 'consultation' },
        ],
      },
    }),
    maxQuantity: Property.Number({
      displayName: 'Max Quantity',
      description: 'Maximum quantity per order (leave empty for unlimited)',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('products/create', {
      name: context.propsValue.name,
      description: context.propsValue.description,
      price: context.propsValue.price,
      productType: context.propsValue.productType,
      maxQuantity: context.propsValue.maxQuantity,
    });
  },
});
