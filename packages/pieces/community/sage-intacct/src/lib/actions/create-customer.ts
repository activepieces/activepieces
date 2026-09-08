import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';

export const createCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new customer record in Sage Intacct. Use when you need to add a customer that does not already exist; for changing an existing customer use Update Customer instead. Each call creates a new customer, so retries duplicate.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Display name for the customer, e.g. "Starluck".',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Unique identifier for the customer, e.g. "CUST-002". Auto-generated if left blank.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    creditLimit: Property.Number({
      displayName: 'Credit Limit',
      required: false,
    }),
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'Tax identification number, e.g. "12-3456789".',
      required: false,
    }),
  },
  async run(context) {
    const { name, id, status, creditLimit, taxId } = context.propsValue;
    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: `/objects/${sageIntacctClient.objects.customer}`,
      body: {
        name,
        ...spreadIfDefined('id', id),
        ...spreadIfDefined('status', status),
        ...spreadIfDefined('creditLimit', creditLimit),
        ...spreadIfDefined('taxId', taxId),
      },
    });
  },
});
