import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { bokioSchemas } from '../common/schemas';
import { invoiceUpdater } from './update-an-invoice';

export const aiUpdateInvoice = createAction({
  auth: bokioAuth,
  name: 'ai_update_invoice',
  classification: 'WRITE',
  displayName: 'Update Draft Invoice',
  description: 'Changes header fields of a draft invoice in Bokio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes header fields of an existing DRAFT invoice (invoiceId from List Invoices) and returns the updated invoice. Only the fields you pass change; line items and all other fields are kept. Dates are YYYY-MM-DD. Does not edit line items (use Add Invoice Line Item). Fails on published invoices. Idempotent: repeating the same change gives the same invoice.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Draft invoice UUID. Get it from List Invoices (status draft) or the output of Create Invoice.',
      required: true,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer. Leave empty to keep the current customer.',
      required: false,
    }),
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'YYYY-MM-DD. Omit to keep.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD. Omit to keep.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO 4217 code. Omit to keep.',
      required: false,
    }),
    orderNumberReference: Property.ShortText({
      displayName: 'Order Number Reference',
      description: 'Omit to keep.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    return invoiceUpdater.updateDraftInvoice({
      auth: context.auth.props,
      invoiceId: p.invoiceId,
      changes: {
        customerId: p.customerId,
        invoiceDate: p.invoiceDate,
        dueDate: p.dueDate,
        currency: p.currency,
        orderNumberReference: p.orderNumberReference,
      },
    });
  },
});
