import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroListAccounts = createAction({
  auth: xeroAuth,
  name: 'xero_list_accounts',
  classification: 'SEARCH',
  displayName: 'List Accounts',
  description: 'Lists the chart of accounts, optionally filtered by type, class or status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists accounts from the chart of accounts with their code, name, type, class, tax type and whether payments are enabled, optionally filtered by type (e.g. BANK, REVENUE, EXPENSE), class or status. Use it to find the AccountCode for line items or the bank account for payments. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.accounts,
  props: {
    tenant_id: props.tenant_id,
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          'BANK', 'CURRENT', 'CURRLIAB', 'DEPRECIATN', 'DIRECTCOSTS', 'EQUITY', 'EXPENSE', 'FIXED', 'INVENTORY', 'LIABILITY',
          'NONCURRENT', 'OTHERINCOME', 'OVERHEADS', 'PREPAYMENT', 'REVENUE', 'SALES', 'TERMLIAB',
        ].map((type) => ({ label: type, value: type })),
      },
    }),
    account_class: Property.StaticDropdown({
      displayName: 'Class',
      required: false,
      options: { options: ['ASSET', 'EQUITY', 'EXPENSE', 'LIABILITY', 'REVENUE'].map((value) => ({ label: value, value })) },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'ACTIVE',
      options: { options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Archived', value: 'ARCHIVED' }] },
    }),
    payments_enabled_only: Property.Checkbox({
      displayName: 'Only Accounts That Accept Payments',
      description: 'Keep only bank accounts and accounts with "Enable payments to this account" on.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { tenant_id, type, account_class, status, payments_enabled_only } = context.propsValue;
    const where = [
      ...(type ? [`Type==${xeroInput.whereString({ value: type })}`] : []),
      ...(account_class ? [`Class==${xeroInput.whereString({ value: account_class })}`] : []),
      ...(status ? [`Status==${xeroInput.whereString({ value: status })}`] : []),
    ];
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Accounts`,
      queryParams: { order: 'Code ASC', ...(where.length > 0 ? { where: where.join(' AND ') } : {}) },
      operation: 'list accounts',
    });
    const accounts = xeroApi.recordsOf({ body, key: 'Accounts' });
    const items = payments_enabled_only
      ? accounts.filter((account) => account['Type'] === 'BANK' || account['EnablePaymentsToAccount'] === true)
      : accounts;
    return { items, count: items.length };
  },
});
