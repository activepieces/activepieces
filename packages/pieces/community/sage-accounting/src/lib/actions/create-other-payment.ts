import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createOtherPaymentActionOutputSchema } from '../output-schemas';

export const createOtherPaymentAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_other_payment',
  classification: 'WRITE',
  displayName: 'Create Other Payment (Money Out)',
  description: 'Records money leaving the business in Sage Accounting that is not tied to an invoice, e.g. bank charges or drawings.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record money paid out of the business in Sage Accounting that has no related invoice or bill (e.g. bank charges, owner drawings). Each call creates a new payment, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createOtherPaymentActionOutputSchema,
  props: {
    bankAccount: sageAccountingDropdowns.bankAccountId,
    contact: sageAccountingDropdowns.contactFilter,
    date: Property.DateTime({ displayName: 'Date', required: true }),
    totalAmount: Property.Number({ displayName: 'Total Amount', required: true }),
    paymentMethod: sageAccountingDropdowns.paymentMethodId,
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        ledgerAccountId: Property.ShortText({
          displayName: 'Ledger Account ID',
          description: 'The ledger account this line is posted to. Find it under Settings > Chart of Accounts in Sage Accounting.',
          required: true,
        }),
        amount: Property.Number({ displayName: 'Amount', required: true }),
        taxRateId: Property.ShortText({
          displayName: 'Tax Rate ID',
          description: 'The tax rate to apply to this line. Find it under Settings > Tax Rates in Sage Accounting.',
          required: false,
        }),
        details: Property.ShortText({ displayName: 'Details', required: false }),
      },
    }),
  },
  async run(context) {
    const { bankAccount, contact, date, totalAmount, paymentMethod, reference, lines } =
      context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as PaymentLineInput[];

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.otherPayments,
      body: {
        other_payment: {
          transaction_type_id: sageAccountingClient.transactionTypes.otherPayment,
          bank_account_id: bankAccount,
          date: sageAccountingClient.toDate(date),
          total_amount: totalAmount,
          ...spreadIfDefined('contact_id', contact),
          ...spreadIfDefined('payment_method_id', paymentMethod),
          ...spreadIfDefined('reference', reference),
          payment_lines: lineItems.map((line) => ({
            ledger_account_id: line.ledgerAccountId,
            total_amount: line.amount,
            ...spreadIfDefined('tax_rate_id', line.taxRateId),
            ...spreadIfDefined('details', line.details),
          })),
        },
      },
    });
  },
});

type PaymentLineInput = {
  ledgerAccountId: string;
  amount: number;
  taxRateId?: string;
  details?: string;
};
