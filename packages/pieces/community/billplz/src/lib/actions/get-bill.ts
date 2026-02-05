import { 
  createAction, 
  Property, 
} from '@activepieces/pieces-framework';
import { billplzApi } from '../common/api';
import { billplzAuth } from '../common/auth';

export const getBill = createAction({
  name: 'get_bill',
  displayName: 'Get Bill',
  description: 'Retrieve information about a specific bill',
  auth: billplzAuth,
  props: {
    bill_id: Property.ShortText({
      displayName: 'Bill ID',
      description: 'The ID of the bill to retrieve',
      required: true
    })
  },
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!propsValue.bill_id) {
      throw new Error('Bill ID is required');
    }

    try {
      const response = await billplzApi.getBill(auth.secret_text, propsValue.bill_id);
      return response.body;
    } catch (error: unknown) {
      throw new Error(`Failed to get bill: ${(error as Error).message}`);
    }
  }
});
