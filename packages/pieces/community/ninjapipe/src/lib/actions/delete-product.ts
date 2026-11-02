import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteProduct = createAction({
  auth: ninjapipeAuth,
  name: 'delete_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product',
  description: 'Permanently deletes a product.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe product by ID (productId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the product is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    productId: ninjapipeProps.productRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.productId, field: 'Product' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/products/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete product',
    });
  },
});
