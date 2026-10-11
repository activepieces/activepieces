import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps } from '../../common/props';
import { deleteProductOutputSchema } from '../../output-schemas';

export const wooAiDeleteProduct = createAction({
  name: 'delete_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product',
  description: 'Move a product to the trash, or delete it permanently.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one product by id. By default it goes to the trash, which a person can restore from the WordPress admin; with permanent it is deleted for good, together with all variations of a variable product. Trashing an already-trashed product fails, so a retry is not safe.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: deleteProductOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Id of the product to delete. Find it with list_products.',
      required: true,
    }),
    permanent: wooProps.permanentProp({ resource: 'product' }),
  },
  async run(context) {
    const { product_id, permanent } = context.propsValue;
    return wooClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/products/${wooClient.encodeId(product_id)}`,
      queryParams: { force: permanent === true },
    });
  },
});
