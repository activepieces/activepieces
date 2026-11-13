import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const deleteCustomerByIdAction = createAction({
  name: 'delete_customer_by_id',
  classification: 'DESTRUCTIVE',
  auth: squareAuth,
  displayName: 'Delete Customer (by ID)',
  description: 'Permanently deletes a customer profile by customer ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a Square customer by customer ID, including it from the Customer Directory. Cannot be undone; prefer Update Customer (by ID) when the user only wants to change details. A second call fails with not found.',
    idempotent: false,
  },
  props: {
    customer_id: squareProps.idText({ displayName: 'Customer ID', description: 'Square customer ID (from Find Customers).' }),
  },
  outputSchema: squareOutputSchemas.deleted,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer ID' });
    return squareOps.deleteCustomer({ auth: context.auth, customerId });
  },
});
