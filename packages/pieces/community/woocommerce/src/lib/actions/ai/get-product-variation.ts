import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { productVariationOutputSchema } from '../../output-schemas';

export const wooAiGetProductVariation = createAction({
  name: 'get_product_variation',
  classification: 'READ',
  displayName: 'Get Product Variation',
  description: 'Get one variation of a variable product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one variation of a variable product by product id and variation id, including its attributes, price and stock. Variation ids come from list_product_variations or from the variations list of get_product. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: productVariationOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Id of the parent variable product.',
      required: true,
    }),
    variation_id: Property.Number({
      displayName: 'Variation ID',
      description: 'Id of the variation.',
      required: true,
    }),
  },
  async run(context) {
    const { product_id, variation_id } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/products/${wooClient.encodeId(product_id)}/variations/${wooClient.encodeId(variation_id)}`,
    });
  },
});
