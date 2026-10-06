import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { updateCustomerOutputSchema } from '../../output-schemas';
import { wooUpdateCustomer } from '../update-customer';

export const wooAiUpdateCustomer = createAction({
  name: 'update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Change the name, email or billing details of a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the email, first or last name, or billing phone, city, postcode and country of one customer by id; fields left empty are kept. Find the id with list_customers.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateCustomerOutputSchema,
  props: wooUpdateCustomer.props,
  run: wooUpdateCustomer.run,
});
