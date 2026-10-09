import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareIdempotency } from '../common/idempotency';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const createCustomerAction = createAction({
  name: 'create_customer',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Customer',
  description: 'Adds a customer profile to the Square Customer Directory.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Square customer profile; needs at least one of first name, last name, company, email or phone. Square allows duplicate emails, so run Find Customers first to avoid duplicates. A retried step returns the same customer instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    ...squareProps.customerFields({ forUpdate: false }),
    idempotency_key: squareProps.idempotencyKey(),
  },
  outputSchema: squareOutputSchemas.customer,
  async run(context) {
    const fields = squareOps.customerFields(context.propsValue);
    if (!['given_name', 'family_name', 'company_name', 'email_address', 'phone_number'].some((key) => fields[key] !== undefined)) {
      throw new Error('Fill at least one of First Name, Last Name, Company, Email or Phone.');
    }
    const body = await squareIdempotency.execute({
      context,
      action: 'create_customer',
      input: fields,
      send: ({ idempotencyKey }) =>
        squareClient.request<unknown>({
          auth: context.auth,
          method: HttpMethod.POST,
          path: ['v2', 'customers'],
          body: { ...fields, idempotency_key: idempotencyKey },
          operation: 'create the customer',
        }),
    });
    return squareShape.customer(squareShape.requireObject({ body, key: 'customer', what: 'customer' }));
  },
});
