import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiUpdateProduct = createAction({
  auth: joggAiAuth,
  name: 'ai_update_product',
  displayName: 'Update Product',
  description: 'Updates the name, description or target audience of a JoggAI product.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: joggAiOutputSchemas.aiProduct,
  aiMetadata: {
    description:
      'Updates a JoggAI product by product_id (from Create Product). Only the fields you give are sent; empty fields are left unchanged. Idempotent: repeating the same update leaves the product in the same state.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'product_id returned by Create Product.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    target_audience: Property.ShortText({
      displayName: 'Target Audience',
      required: false,
    }),
  },
  async run(context) {
    const { product_id, name, description, target_audience } = context.propsValue;
    const productId = product_id.trim();
    if (!productId) {
      throw new Error('Product ID is required.');
    }
    const fields = joggAiClient.compact({ name, description, target_audience });
    if (Object.keys(fields).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: '/v2/product',
      op: 'update product',
      body: { product_id: productId, ...fields },
    });
    return { product_id: productId };
  },
});
