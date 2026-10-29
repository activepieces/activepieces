import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreatePaymentAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_payment_ai',
  classification: 'WRITE',
  displayName: 'Record Payment',
  description: 'Records a payment against an approved invoice or bill from a bank account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a payment of an amount against an AUTHORISED invoice or bill by InvoiceID, paid into or out of a bank account given by AccountID or account code; the amount must not exceed the amount due. Use List Accounts (Only Accounts That Accept Payments) to find the account. Not idempotent: a re-run pays twice; Delete Payment reverses it.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.payment,
  props: {
    tenant_id: aiProps.tenantId(),
    invoice_id: aiProps.id({ displayName: 'Invoice ID', description: 'Xero InvoiceID (a GUID) of the AUTHORISED invoice or bill.' }),
    account_id: Property.ShortText({ displayName: 'Account ID', description: 'AccountID of the bank account. Give this or Account Code.', required: false }),
    account_code: Property.ShortText({ displayName: 'Account Code', description: 'Code of the bank account, e.g. 090. Give this or Account ID.', required: false }),
    amount: Property.Number({ displayName: 'Amount', description: 'Payment amount in the invoice currency, up to 2 decimal places.', required: true }),
    date: Property.ShortText({ displayName: 'Payment Date (YYYY-MM-DD)', required: true }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    currency_rate: Property.Number({ displayName: 'Currency Rate', description: 'Exchange rate for foreign-currency invoices.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const invoiceId = xeroInput.requiredText({ value: values.invoice_id, field: 'Invoice ID' });
    const accountId = xeroInput.trimmedOrUndefined({ value: values.account_id });
    const accountCode = xeroInput.trimmedOrUndefined({ value: values.account_code });
    if ((accountId === undefined) === (accountCode === undefined)) {
      throw new Error('Give exactly one of Account ID or Account Code.');
    }
    const amount = xeroInput.parseDecimal({ value: values.amount, field: 'Amount', maxDecimals: 2, positive: true });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Payment Date' });
    if (!date) throw new Error('Payment Date is required.');
    const currencyRate = xeroInput.optionalDecimal({ value: values.currency_rate, field: 'Currency Rate', maxDecimals: 10, positive: true });
    const reference = xeroInput.trimmedOrUndefined({ value: values.reference });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/Payments`,
      body: {
        Payments: [
          {
            Invoice: { InvoiceID: invoiceId },
            Account: accountId ? { AccountID: accountId } : { Code: accountCode },
            Amount: amount,
            Date: date,
            ...(reference ? { Reference: reference } : {}),
            ...(currencyRate !== undefined ? { CurrencyRate: currencyRate } : {}),
          },
        ],
      },
      operation: 'record payment',
    });
    return xeroApi.firstRecord({ body, key: 'Payments', operation: 'record payment' });
  },
});
