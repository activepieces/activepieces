import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommonProps } from '../common/props';

export const deleteFormProduct = createAction({
  auth: paperformAuth,
  name: 'deleteFormProduct',
  displayName: 'Delete Form Product',
  description: 'Deletes an existing form product.',
  props: {
    formId: paperformCommonProps.formId,
    productSku: paperformCommonProps.productSku,
  },
  async run({ auth, propsValue }) {
    const { formId, productSku } = propsValue;
    
    try {
      await paperformCommon.apiCall({
        method: HttpMethod.DELETE,
        url: `/forms/${formId}/products/${productSku}`,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Product "${productSku}" has been successfully deleted.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },
});
