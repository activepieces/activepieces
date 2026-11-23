import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { getProductOutputSchema } from '../common/schemas';
import { parsePositiveIntId } from '../common/shared-runs';

export const getProduct = createAction({
  auth: bigcommerceAuth,
  name: 'getProduct',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Gets a catalog product by ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one BigCommerce catalog product by numeric product_id (from Search Product or a product trigger) and returns the product record. Fails with a not-found error when no product has that id. Read-only.',
    idempotent: true,
  },
  outputSchema: getProductOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'Numeric BigCommerce product ID',
      required: true,
    }),
  },
  async run(context) {
    const productId = parsePositiveIntId({ value: context.propsValue.product_id, field: 'Product ID' });
    const response = await bigCommerceApiService.fetchProduct({
      auth: context.auth.props,
      productId: String(productId),
    });
    if (!response?.data) {
      throw new Error(`BigCommerce product ${productId} was not found.`);
    }
    return response.data;
  },
});
