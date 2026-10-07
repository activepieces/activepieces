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
      'Creates a Square customer profile; needs at least one of first name, last name, company, email or phone. Square allows duplicate emails, so run Find Customers first to avoid duplicates. A retried step in the same run returns the same customer; a new run creates another.',
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
    const idempotencyKey = squareIdempotency.fromContext({ context, action: 'create_customer', input: fields });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['v2', 'customers'],
      body: { ...fields, idempotency_key: idempotencyKey },
      operation: 'create the customer',
    });
    return squareShape.customer(squareShape.requireObject({ body, key: 'customer', what: 'customer' }));
  },
});
