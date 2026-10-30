import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getProduct = createAction({
  auth: ninjapipeAuth,
  name: 'get_product',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Gets one product by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe product by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.product,
  props: {
    productId: ninjapipeProps.productRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.productId, field: 'Product' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/products/${id}`, operation: 'get product' });
  },
});
