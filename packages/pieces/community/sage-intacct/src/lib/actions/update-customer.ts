import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const updateCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Updates an existing customer in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Intacct customer, identified by its system key. Only the fields you provide are changed. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    customer: sageIntacctDropdowns.customerByKey,
    name: Property.ShortText({ displayName: 'Customer Name', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
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
    const { customer, name, status, creditLimit, taxId } = context.propsValue;
    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: `/objects/${sageIntacctClient.objects.customer}/${customer}`,
      body: {
        ...spreadIfDefined('name', name),
        ...spreadIfDefined('status', status),
        ...spreadIfDefined('creditLimit', creditLimit),
        ...spreadIfDefined('taxId', taxId),
      },
    });
  },
});
