import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { getRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const getCustomer = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a customer by ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy customer by numeric customer ID, including status, revenue, MRR and customer portal URL. Use Find Customer by Email when you only have an email. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.customer),
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The numeric ID of the customer.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return getRecord({ apiKey: auth.secret_text, path: `/customers/${seg({ value: propsValue.customerId, label: 'Customer ID' })}` });
  },
});
