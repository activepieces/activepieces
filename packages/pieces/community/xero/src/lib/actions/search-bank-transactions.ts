import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroSearchBankTransactions = createAction({
  auth: xeroAuth,
  name: 'xero_search_bank_transactions',
  classification: 'SEARCH',
  displayName: 'Search Bank Transactions',
  description: 'Searches spend and receive money transactions by type, status, bank account, contact or date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches bank transactions (spend money, receive money, overpayments, prepayments, transfers) filtered by type, status, bank account ID, contact ID, reconciled flag or date range, newest first; returns one page with a hasMore flag. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.bankTransactionsPage,
  props: {
    tenant_id: props.tenant_id,
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: ['RECEIVE', 'SPEND', 'RECEIVE-OVERPAYMENT', 'SPEND-OVERPAYMENT', 'RECEIVE-PREPAYMENT', 'SPEND-PREPAYMENT', 'RECEIVE-TRANSFER', 'SPEND-TRANSFER'].map(
          (type) => ({ label: type, value: type }),
        ),
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: [{ label: 'AUTHORISED', value: 'AUTHORISED' }, { label: 'DELETED', value: 'DELETED' }] },
    }),
    bank_account_id: Property.ShortText({ displayName: 'Bank Account ID', description: 'Xero AccountID of the bank account (List Accounts).', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: false }),
    is_reconciled: Property.StaticDropdown({
      displayName: 'Reconciled',
      required: false,
      options: { options: [{ label: 'Reconciled only', value: 'true' }, { label: 'Unreconciled only', value: 'false' }] },
    }),
    date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    page_size: Property.Number({ displayName: 'Page Size', description: 'Transactions per page, 1 to 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const { tenant_id, type, status, bank_account_id, contact_id, is_reconciled, date_from, date_to, page, page_size } = context.propsValue;
    const paging = xeroInput.pageParams({ page, pageSize: page_size, maxPageSize: 100 });
    const from = xeroInput.parseDateInput({ value: date_from, field: 'Date From' });
    const to = xeroInput.parseDateInput({ value: date_to, field: 'Date To' });
    const bankAccountId = xeroInput.trimmedOrUndefined({ value: bank_account_id });
    const contactId = xeroInput.trimmedOrUndefined({ value: contact_id });
    const where = [
      ...(type ? [`Type==${xeroInput.whereString({ value: type })}`] : []),
      ...(status ? [`Status==${xeroInput.whereString({ value: status })}`] : []),
      ...(bankAccountId ? [`BankAccount.AccountID==${xeroInput.whereGuid({ value: bankAccountId, field: 'Bank Account ID' })}`] : []),
      ...(contactId ? [`Contact.ContactID==${xeroInput.whereGuid({ value: contactId, field: 'Contact ID' })}`] : []),
      ...(is_reconciled === 'true' || is_reconciled === 'false' ? [`IsReconciled==${is_reconciled}`] : []),
      ...(from ? [`Date>=${xeroInput.whereDate({ value: from })}`] : []),
      ...(to ? [`Date<=${xeroInput.whereDate({ value: to })}`] : []),
    ];
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/BankTransactions`,
      queryParams: {
        page: String(paging.page),
        pageSize: String(paging.pageSize),
        order: 'Date DESC',
        unitdp: '4',
        ...(where.length > 0 ? { where: where.join(' AND ') } : {}),
      },
      operation: 'search bank transactions',
    });
    return xeroApi.pageResult({ body, key: 'BankTransactions', ...paging });
  },
});
