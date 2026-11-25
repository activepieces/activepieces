import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';

export const listTransactionDefinitionsAction = createAction({
  auth: sageIntacctAuth,
  name: 'list_transaction_definitions',
  displayName: 'List Transaction Definitions',
  description: 'List Order Entry or Purchasing transaction definitions (document types) in Sage Intacct.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Sage Intacct transaction definitions (document types such as "Sales Invoice" or "Vendor Invoice", named per company) for one module: module is "order-entry" or "purchasing". Returns up to 1000 items with key, id (the document type name used on order-entry and purchasing documents) and status. Read-only.',
    idempotent: true,
  },
  props: {
    module: Property.StaticDropdown({
      displayName: 'Module',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Order Entry', value: 'order-entry' },
          { label: 'Purchasing', value: 'purchasing' },
        ],
      },
    }),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
      {
        key: 'items',
        label: 'Items',
        labelKey: 'id',
        listItems: [
          { key: 'key', label: 'Key' },
          { key: 'id', label: 'Document Type' },
          { key: 'status', label: 'Status' },
        ],
      },
    ],
  },
  async run(context) {
    const module = context.propsValue.module;
    if (module !== 'order-entry' && module !== 'purchasing') {
      throw new Error('Module must be "order-entry" or "purchasing".');
    }
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: `${module}/txn-definition`,
      fields: ['key', 'id', 'status'],
      orderBy: [{ id: 'asc' }],
      limit: 1000,
    });
    const items = records.map((record) => ({
      key: sageIntacctClient.readString({ record, path: 'key' }),
      id: sageIntacctClient.readString({ record, path: 'id' }),
      status: sageIntacctClient.readString({ record, path: 'status' }),
    }));
    return { count: items.length, truncated, items };
  },
});
