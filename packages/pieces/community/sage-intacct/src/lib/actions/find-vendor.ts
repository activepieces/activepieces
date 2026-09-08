import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

export const findVendorAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_vendor',
  classification: 'SEARCH',
  displayName: 'Find Vendor',
  description: 'Searches for vendors in Sage Intacct by name, ID, or status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Intacct vendors by name (partial match), exact vendor ID, or status. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'builder',
      label: 'Filters',
      icon: 'filter',
      props: ['name', 'vendorId', 'status'],
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
      description: 'Filter by vendor name, e.g. "Acme".',
      required: false,
      icon: 'text',
    }),
    vendorId: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'Filter by exact vendor ID, e.g. "VEND-00010".',
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
    const { name, vendorId, status, maxResults } = context.propsValue;
    const filters: IntacctFilter[] = [];
    if (name) filters.push({ $contains: { name } });
    if (vendorId) filters.push({ $eq: { id: vendorId } });
    if (status) filters.push({ $eq: { status } });

    const { records } = await sageIntacctClient.query<VendorRecord>({
      accessToken: context.auth.access_token,
      object: sageIntacctClient.objects.vendor,
      fields: ['key', 'id', 'name', 'status', 'billingType', 'totalDue'],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ name: 'asc' }],
      size: maxResults ?? 10,
    });

    return records;
  },
});

type VendorRecord = {
  key: string;
  id: string;
  name: string;
  status: string;
  billingType: string | null;
  totalDue: number | null;
};
