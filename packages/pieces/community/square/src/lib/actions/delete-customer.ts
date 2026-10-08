import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const deleteCustomerAction = createAction({
  name: 'delete_customer',
  classification: 'DESTRUCTIVE',
  auth: squareAuth,
  displayName: 'Delete Customer',
  description: 'Permanently deletes a customer profile.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes a Square customer picked from a list; agents use Delete Customer (by ID). Cannot be undone; a second run fails with not found.',
    idempotent: false,
  },
  props: {
    customer_id: squareProps.customer({ required: true }),
  },
  outputSchema: squareOutputSchemas.deleted,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer' });
    return squareOps.deleteCustomer({ auth: context.auth, customerId });
  },
});
