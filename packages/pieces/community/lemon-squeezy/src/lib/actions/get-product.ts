import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { getRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const getProduct = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: 'Retrieve a product by ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy product by numeric product ID: name, status, price range in cents and buy-now URL. Use List Variants for its variants. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.product),
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'The numeric ID of the product.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return getRecord({ apiKey: auth.secret_text, path: `/products/${seg({ value: propsValue.productId, label: 'Product ID' })}` });
  },
});
