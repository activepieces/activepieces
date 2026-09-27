import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { getCustomerOutputSchema } from '../../output-schemas';
import { wooGetCustomer } from '../get-customer';

export const wooAiGetCustomer = createAction({
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Get a customer by their ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one customer by numeric id, with role, billing and shipping addresses and whether they have paid for an order. To find a customer by email or name use list_customers first. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: getCustomerOutputSchema,
  props: wooGetCustomer.props,
  run: wooGetCustomer.run,
});
