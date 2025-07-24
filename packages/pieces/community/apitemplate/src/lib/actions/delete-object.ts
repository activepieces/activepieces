import { createAction } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';
import { transactionRefProp } from '../common/props';

export const deleteObject = createAction({
  auth: apitemplateAuth,
  name: 'delete_object',
  displayName: 'Delete Generated Object',
  description: 'Delete a previously generated image or PDF using its transaction reference',
  props: {
    transaction_ref: transactionRefProp,
  },
  async run(context) {
    const { transaction_ref } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const result = await client.deleteObject(transaction_ref);
      
      return {
        success: true,
        message: `Object with transaction reference ${transaction_ref} deleted successfully`,
        deleted_transaction_ref: transaction_ref,
        result,
      };
    } catch (error) {
      throw new Error(`Failed to delete object: ${error}`);
    }
  },
});