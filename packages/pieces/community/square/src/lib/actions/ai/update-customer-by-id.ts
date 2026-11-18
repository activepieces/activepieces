import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const updateCustomerByIdAction = createAction({
  name: 'update_customer_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Update Customer (by ID)',
  description: 'Changes fields on a customer profile by customer ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a Square customer by customer ID: only the fields you pass change, and Fields to Clear empties fields. It reads the current version first, so it does not overwrite concurrent edits silently. Setting the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    customer_id: squareProps.idText({ displayName: 'Customer ID', description: 'Square customer ID (from Find Customers).' }),
    ...squareProps.customerFields({ forUpdate: true }),
    clear_fields: squareProps.clearCustomerFields(),
  },
  outputSchema: squareOutputSchemas.customer,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer ID' });
    return squareOps.updateCustomer({ auth: context.auth, customerId, props: context.propsValue });
  },
});
