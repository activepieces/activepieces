import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreateBankTransactionAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_bank_transaction_ai',
  classification: 'WRITE',
  displayName: 'Create Bank Transaction',
  description: 'Records a spend money or receive money transaction on a bank account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a spend money (SPEND) or receive money (RECEIVE) transaction for a ContactID on a bank account given by AccountID or account code, with JSON line items; use it for money that is not paying an invoice (use Record Payment for invoices). Not idempotent: each call records another transaction.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.bankTransaction,
  props: {
    tenant_id: aiProps.tenantId(),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: { options: [{ label: 'Spend money (SPEND)', value: 'SPEND' }, { label: 'Receive money (RECEIVE)', value: 'RECEIVE' }] },
    }),
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Xero ContactID (a GUID).' }),
    bank_account_id: Property.ShortText({ displayName: 'Bank Account ID', description: 'AccountID of the bank account. Give this or Bank Account Code.', required: false }),
    bank_account_code: Property.ShortText({ displayName: 'Bank Account Code', description: 'Code of the bank account, e.g. 090. Give this or Bank Account ID.', required: false }),
    line_items: aiProps.lineItems(),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    is_reconciled: Property.Checkbox({ displayName: 'Mark as Reconciled', required: false, defaultValue: false }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: { options: [{ label: 'Tax exclusive', value: 'Exclusive' }, { label: 'Tax inclusive', value: 'Inclusive' }, { label: 'No tax', value: 'NoTax' }] },
    }),
    currency_code: Property.ShortText({ displayName: 'Currency Code', description: 'ISO code such as USD; defaults to the organisation base currency.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const contactId = xeroInput.requiredText({ value: values.contact_id, field: 'Contact ID' });
    const bankAccountId = xeroInput.trimmedOrUndefined({ value: values.bank_account_id });
    const bankAccountCode = xeroInput.trimmedOrUndefined({ value: values.bank_account_code });
    if ((bankAccountId === undefined) === (bankAccountCode === undefined)) {
      throw new Error('Give exactly one of Bank Account ID or Bank Account Code.');
    }
    const lineItems = aiInput.parseLineItems({ value: values.line_items });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/BankTransactions`,
      queryParams: { unitdp: '4' },
      body: {
        BankTransactions: [
          {
            Type: values.type,
            Contact: { ContactID: contactId },
            BankAccount: bankAccountId ? { AccountID: bankAccountId } : { Code: bankAccountCode },
            LineItems: lineItems,
            ...(date ? { Date: date } : {}),
            ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
            ...(values.is_reconciled ? { IsReconciled: true } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(text(values.currency_code) ? { CurrencyCode: text(values.currency_code) } : {}),
          },
        ],
      },
      operation: 'create bank transaction',
    });
    return xeroApi.firstRecord({ body, key: 'BankTransactions', operation: 'create bank transaction' });
  },
});
