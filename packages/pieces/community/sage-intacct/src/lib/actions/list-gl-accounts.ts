import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';

export const listGlAccountsAction = createAction({
  auth: sageIntacctAuth,
  name: 'list_gl_accounts',
  displayName: 'List GL Accounts',
  description: 'List general ledger accounts in Sage Intacct.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Sage Intacct general ledger accounts, up to 1000, ordered by account number, with key, id (the account number used on invoice and bill lines), name, account_type, normal_balance and status. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
      {
        key: 'items',
        label: 'Items',
        labelKey: 'name',
        listItems: [
          { key: 'key', label: 'Key' },
          { key: 'id', label: 'Account Number' },
          { key: 'name', label: 'Name' },
          { key: 'account_type', label: 'Account Type' },
          { key: 'normal_balance', label: 'Normal Balance' },
          { key: 'status', label: 'Status' },
        ],
      },
    ],
  },
  async run(context) {
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: 'general-ledger/account',
      fields: ['key', 'id', 'name', 'accountType', 'normalBalance', 'status'],
      orderBy: [{ id: 'asc' }],
      limit: 1000,
    });
    const items = records.map((record) => ({
      key: sageIntacctClient.readString({ record, path: 'key' }),
      id: sageIntacctClient.readString({ record, path: 'id' }),
      name: sageIntacctClient.readString({ record, path: 'name' }),
      account_type: sageIntacctClient.readString({ record, path: 'accountType' }),
      normal_balance: sageIntacctClient.readString({ record, path: 'normalBalance' }),
      status: sageIntacctClient.readString({ record, path: 'status' }),
    }));
    return { count: items.length, truncated, items };
  },
});
