import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const findFormProductAction = createAction({
  displayName: 'Find Form Product',
  name: 'find_form_product',
  description: 'Retrieve product metadata from a form by product ID or name',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    productSku: Property.ShortText({
      displayName: 'Product SKU',
      description: 'The SKU of the product',
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
      HttpMethod.GET
    );
    
    return {
      success: true,
      message: 'Product retrieved successfully',
      product: response.body,
      formSlugOrId: propsValue.formSlugOrId,
      productSku: propsValue.productSku,
    };
  },
}); 