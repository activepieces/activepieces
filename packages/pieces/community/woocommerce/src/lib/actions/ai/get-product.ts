import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { findProductOutputSchema } from '../../output-schemas';
import { wooFindProduct } from '../find-product';

export const wooAiGetProduct = createAction({
  name: 'get_product',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Get a product by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one product by its numeric id with prices, stock, categories, tags, images and, for a variable product, its variation ids. To find a product by name or SKU use list_products first; for a single variation use get_product_variation. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findProductOutputSchema,
  props: wooFindProduct.props,
  run: wooFindProduct.run,
});
