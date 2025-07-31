import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown, productSKUDropdown } from '../common/props';

export const deleteFormProduct = createAction({
  auth: PaperformAuth,
  name: 'deleteFormProduct',
  displayName: 'Delete Form Product',
  description: 'Delete a product from a specific form',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    product_sku: productSKUDropdown,
  },
  async run(context) {
    const { slug_or_id, product_sku } = context.propsValue;
    const apiKey = context.auth as string;

    await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${slug_or_id}/products/${product_sku}`
    );

    return {
      success: true,
      message: `Successfully deleted product ${product_sku} from form ${slug_or_id}`,
      product_sku,
      form_slug_or_id: slug_or_id,
    };
  },
});
