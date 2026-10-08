import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const updateCustomerAction = createAction({
  name: 'update_customer',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Update Customer',
  description: 'Changes fields on a customer profile. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates a Square customer picked from a list; agents use Update Customer (by ID). Only filled fields change. Setting the same values again is safe.',
    idempotent: true,
  },
  props: {
    customer_id: squareProps.customer({ required: true }),
    ...squareProps.customerFields({ forUpdate: true }),
    clear_fields: squareProps.clearCustomerFields(),
  },
  outputSchema: squareOutputSchemas.customer,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer' });
    return squareOps.updateCustomer({ auth: context.auth, customerId, props: context.propsValue });
  },
});
