import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const deleteProductAction = createAction({
  displayName: 'Delete Form Product',
  name: 'delete_product',
  description: 'Remove a product from a form',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    productSku: Property.ShortText({
      displayName: 'Product SKU',
      description: 'The SKU of the product to delete',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/forms/${propsValue.formSlugOrId}/products/${propsValue.productSku}`;
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.DELETE
    );
    
    return {
      success: true,
      message: 'Product deleted successfully',
      formSlugOrId: propsValue.formSlugOrId,
      productSku: propsValue.productSku,
    };
  },
}); 