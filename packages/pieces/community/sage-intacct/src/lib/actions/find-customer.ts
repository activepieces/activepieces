import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

export const findCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_customer',
  classification: 'SEARCH',
  displayName: 'Find Customer',
  description: 'Searches for customers in Sage Intacct by name, ID, or status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Intacct customers by name (partial match), exact customer ID, or status. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'builder',
      label: 'Filters',
      icon: 'filter',
      props: ['name', 'customerId', 'status'],
    },
    {
      key: 'footer',
      display: 'footer',
      props: ['maxResults'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name contains',
      description: 'Filter by customer name, e.g. "Acme".',
      required: false,
      icon: 'text',
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter by exact customer ID, e.g. "CUST-002".',
      required: false,
      icon: 'tag',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      icon: 'filter',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { name, customerId, status, maxResults } = context.propsValue;
    const filters: IntacctFilter[] = [];
    if (name) filters.push({ $contains: { name } });
    if (customerId) filters.push({ $eq: { id: customerId } });
    if (status) filters.push({ $eq: { status } });

    const { records } = await sageIntacctClient.query<CustomerRecord>({
      accessToken: context.auth.access_token,
      object: sageIntacctClient.objects.customer,
      fields: ['key', 'id', 'name', 'status', 'creditLimit', 'taxId', 'totalDue'],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ name: 'asc' }],
      size: maxResults ?? 10,
    });

    return records;
  },
});

type CustomerRecord = {
  key: string;
  id: string;
  name: string;
  status: string;
  creditLimit: number | null;
  taxId: string | null;
  totalDue: number | null;
};
