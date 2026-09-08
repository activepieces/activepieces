import { Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

function referenceDropdown({
  displayName,
  description,
  object,
  fields,
  label,
  value,
  filters,
  required = true,
}: {
  displayName: string;
  description: string;
  object: string;
  fields: string[];
  label: (record: Record<string, string>) => string;
  value: (record: Record<string, string>) => string;
  filters?: IntacctFilter[];
  required?: boolean;
}) {
  return Property.Dropdown({
    displayName,
    description,
    auth: sageIntacctAuth,
    refreshers: [],
    required,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Sage Intacct account first',
        };
      }
      const combinedFilters = [
        ...(filters ?? []),
        ...(searchValue ? [{ $contains: { [fields[0]]: searchValue } }] : []),
      ];
      const { records } = await sageIntacctClient.query<Record<string, string>>({
        accessToken: auth.access_token,
        object,
        fields,
        ...(combinedFilters.length > 0 ? { filters: combinedFilters } : {}),
        orderBy: [{ [fields[0]]: 'asc' }],
        size: 100,
      });
      return {
        disabled: false,
        options: records.map((record) => ({ label: label(record), value: value(record) })),
      };
    },
  });
}

export const sageIntacctDropdowns = {
  customerByKey: referenceDropdown({
    displayName: 'Customer',
    description: 'The customer to update.',
    object: sageIntacctClient.objects.customer,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['key'],
  }),
  customerById: referenceDropdown({
    displayName: 'Customer',
    description: 'The customer this record belongs to.',
    object: sageIntacctClient.objects.customer,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['id'],
  }),
  vendorById: referenceDropdown({
    displayName: 'Vendor',
    description: 'The vendor this record belongs to.',
    object: sageIntacctClient.objects.vendor,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['id'],
  }),
  invoiceByKey: referenceDropdown({
    displayName: 'Invoice',
    description: 'The AR invoice to update.',
    object: sageIntacctClient.objects.arInvoice,
    fields: ['invoiceNumber', 'key', 'id'],
    label: (r) => `${r['invoiceNumber'] || r['id']} (${r['id']})`,
    value: (r) => r['key'],
  }),
  billByKey: referenceDropdown({
    displayName: 'Bill',
    description: 'The AP bill to update.',
    object: sageIntacctClient.objects.bill,
    fields: ['billNumber', 'key', 'id'],
    label: (r) => `${r['billNumber'] || r['id']} (${r['id']})`,
    value: (r) => r['key'],
  }),
  vendorInvoiceByKey: referenceDropdown({
    displayName: 'Vendor Invoice',
    description: 'The Purchasing vendor invoice to update.',
    object: sageIntacctClient.objects.purchasingDocument,
    fields: ['documentNumber', 'key', 'id'],
    label: (r) => `${r['documentNumber'] || r['id']} (${r['id']})`,
    value: (r) => r['key'],
    filters: [{ $eq: { documentType: 'Vendor Invoice' } }],
  }),
  projectByKey: referenceDropdown({
    displayName: 'Project',
    description: 'The project this resource belongs to.',
    object: sageIntacctClient.objects.project,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['key'],
  }),
  employeeByKey: referenceDropdown({
    displayName: 'Employee',
    description: 'The employee to assign as the project resource.',
    object: sageIntacctClient.objects.employee,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['key'],
    required: false,
  }),
  itemByKey: referenceDropdown({
    displayName: 'Item',
    description: 'The billing item to associate with this resource.',
    object: sageIntacctClient.objects.item,
    fields: ['name', 'key', 'id'],
    label: (r) => `${r['name']} (${r['id']})`,
    value: (r) => r['key'],
    required: false,
  }),
  projectResourceByKey: referenceDropdown({
    displayName: 'Existing Project Resource',
    description: 'Leave blank to create a new project resource; select one to update it instead.',
    object: sageIntacctClient.objects.projectResource,
    fields: ['id', 'key', 'description'],
    label: (r) => `${r['description'] || r['id']} (${r['id']})`,
    value: (r) => r['key'],
    required: false,
  }),
};
