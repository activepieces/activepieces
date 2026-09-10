import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createContactPaymentActionOutputSchema } from '../output-schemas';

export const createContactPaymentAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_contact_payment',
  classification: 'WRITE',
  displayName: 'Create Contact Payment',
  description: 'Records a new payment against a contact in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record a payment received from a customer or made to a vendor in Sage Accounting, optionally allocated against existing invoices. Each call creates a new payment, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createContactPaymentActionOutputSchema,
  props: {
    contact: sageAccountingDropdowns.contactById,
    transactionType: sageAccountingDropdowns.transactionTypeId,
    bankAccount: sageAccountingDropdowns.bankAccountId,
    date: Property.DateTime({ displayName: 'Date', required: true }),
    totalAmount: Property.Number({ displayName: 'Total Amount', required: true }),
    paymentMethod: sageAccountingDropdowns.paymentMethodId,
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    taxRate: sageAccountingDropdowns.taxRateId,
    allocations: Property.Array({
      displayName: 'Allocate to Invoices',
      description: 'Optionally apply this payment against one or more existing sales/purchase invoices.',
      required: false,
      properties: {
        artefactId: Property.ShortText({
          displayName: 'Invoice ID',
          description: 'The ID of the sales or purchase invoice to allocate this payment against.',
          required: true,
        }),
        amount: Property.Number({ displayName: 'Amount', required: true }),
        discount: Property.Number({ displayName: 'Discount Amount', required: false }),
      },
    }),
  },
  async run(context) {
    const { contact, transactionType, bankAccount, date, totalAmount, paymentMethod, reference, taxRate, allocations } =
      context.propsValue;
    const allocationLines = allocations as AllocationInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.contactPayments,
      body: {
        contact_payment: {
          transaction_type_id: transactionType,
          contact_id: contact,
          bank_account_id: bankAccount,
          date: sageAccountingClient.toDate(date),
          total_amount: totalAmount,
          ...spreadIfDefined('payment_method_id', paymentMethod),
          ...spreadIfDefined('reference', reference),
          ...spreadIfDefined('tax_rate_id', taxRate),
          ...(allocationLines?.length
            ? {
                allocated_artefacts: allocationLines.map((line) => ({
                  artefact_id: line.artefactId,
                  amount: line.amount,
                  ...spreadIfDefined('discount', line.discount),
                })),
              }
            : {}),
        },
      },
    });
  },
});

type AllocationInput = {
  artefactId: string;
  amount: number;
  discount?: number;
};
