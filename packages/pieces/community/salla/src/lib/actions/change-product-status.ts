import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { ProductStatus, sallaProducts } from '../common/products';
import { sallaProps } from '../common/props';
import { productStatusOptions } from './create-product';

export const changeProductStatusAction = createAction({
  auth: sallaAuth,
  name: 'change_product_status',
  classification: 'WRITE',
  displayName: 'Change Product Status',
  description: 'Puts a product on sale, marks it out of stock, or hides it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the status of one Salla product, by its numeric product ID (1672932878), to sale (on sale), out (out of stock) or hidden. Use Delete Product to remove a product for good and Update Product to change anything else. Setting the same status again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.productStatus,
  props: {
    product: sallaProps.product({ required: true }),
    status: Property.StaticDropdown<ProductStatus, true>({
      displayName: 'Status',
      description: 'New status: sale (On Sale), out (Out of Stock) or hidden (Hidden).',
      display: 'cards',
      required: true,
      defaultValue: 'sale',
      options: { options: productStatusOptions() },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaProducts.changeProductStatus({ auth, productId: propsValue.product, status: propsValue.status });
  },
});
