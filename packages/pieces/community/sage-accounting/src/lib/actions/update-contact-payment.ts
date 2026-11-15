import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { updateContactPaymentActionOutputSchema } from '../output-schemas';

export const updateContactPaymentAction = createAction({
  auth: sageAccountingAuth,
  name: 'update_contact_payment',
  classification: 'WRITE',
  displayName: 'Update Contact Payment',
  description: 'Updates an existing contact payment in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Accounting contact payment, identified by its ID. Only the fields you provide are changed. Safe to retry with the same values.',
    idempotent: true,
  },
  outputSchema: updateContactPaymentActionOutputSchema,
  props: {
    payment: sageAccountingDropdowns.contactPaymentById,
    contact: sageAccountingDropdowns.contactIdOptional,
    date: Property.DateTime({ displayName: 'Date', required: false }),
    totalAmount: Property.Number({ displayName: 'Total Amount', required: false }),
    paymentMethod: sageAccountingDropdowns.paymentMethodId,
    bankAccount: sageAccountingDropdowns.bankAccountIdOptional,
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
    const { payment, contact, date, totalAmount, paymentMethod, bankAccount, reference, taxRate, allocations } =
      context.propsValue;
    const allocationLines = allocations as AllocationInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.contactPayments}/${payment}`,
      body: {
        contact_payment: {
          ...spreadIfDefined('contact_id', contact),
          ...spreadIfDefined('date', date ? sageAccountingClient.toDate(date) : undefined),
          ...spreadIfDefined('total_amount', totalAmount),
          ...spreadIfDefined('payment_method_id', paymentMethod),
          ...spreadIfDefined('bank_account_id', bankAccount),
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
