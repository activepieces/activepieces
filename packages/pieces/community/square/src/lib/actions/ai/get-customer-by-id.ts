import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';

export const getCustomerByIdAction = createAction({
  name: 'get_customer_by_id',
  classification: 'READ',
  auth: squareAuth,
  displayName: 'Get Customer (by ID)',
  description: 'Gets a customer profile by customer ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Square customer (contact details, address, notes, version) by customer ID, as returned by Find Customers or a customer trigger. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    customer_id: squareProps.idText({ displayName: 'Customer ID', description: 'Square customer ID (from Find Customers).' }),
  },
  outputSchema: squareOutputSchemas.customer,
  async run(context) {
    const customerId = squareInputs.requireId({ value: context.propsValue.customer_id, label: 'Customer ID' });
    return squareOps.getCustomer({ auth: context.auth, customerId });
  },
});
