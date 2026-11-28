import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';

export const deleteProductAction = createAction({
  auth: sallaAuth,
  name: 'delete_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product',
  description: 'Permanently deletes a product from the store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Salla product, by its numeric product ID (1672932878), together with its variants and images. To take a product off the store but keep it, use Change Product Status with hidden instead. Cannot be undone, and a retry after a success fails because the product is gone.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.deleteProduct,
  props: {
    product: sallaProps.product({
      required: true,
      description: 'The product to delete. Pick it or search by name or SKU. In a flow, map the numeric product ID, for example 1672932878.',
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.deleteProduct({ auth, productId: propsValue.product });
  },
});
