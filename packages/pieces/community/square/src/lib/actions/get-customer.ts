import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const getCustomerAction = createAction({
  name: 'get_customer',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Customer',
  description: 'Gets a customer profile.',
  audience: 'human',
  aiMetadata: {
    description: 'Reads one Square customer picked from a list. Agents use Get Customer (by ID). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    customer_id: squareProps.customer({ required: true }),
  },
  outputSchema: squareOutputSchemas.customer,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer' });
    return squareOps.getCustomer({ auth: context.auth, customerId });
  },
});
