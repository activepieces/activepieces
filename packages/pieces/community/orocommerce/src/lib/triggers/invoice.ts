import { createOroWebhookTrigger } from '../common/register-webhook';
import { invoiceCreateData, invoiceUpdateData, invoiceDeleteData } from '../examples/invoice';

export const newInvoice = createOroWebhookTrigger({
  name: 'new_invoice',
  description: 'Triggered when a new invoice is created',
  topic: 'invoice.created',
  displayName: 'New Invoice',
  sampleData: invoiceCreateData,
});

export const updatedInvoice = createOroWebhookTrigger({
  name: 'updated_invoice',
  description: 'Triggered when an invoice is updated',
  topic: 'invoice.updated',
  displayName: 'Invoice Update',
  sampleData: invoiceUpdateData,
});

export const removedInvoice = createOroWebhookTrigger({
  name: 'removed_invoice',
  description: 'Triggered when an invoice is deleted',
  topic: 'invoice.deleted',
  displayName: 'Invoice Removal',
  sampleData: invoiceDeleteData,
});

export const paymentForInvoice = createOroWebhookTrigger({
  name: 'invoice_payment',
  description: 'Triggered when an invoice payment status is changed',
  topic: 'invoice.payment_status_changed',
  displayName: 'Invoice Payment Status Changed',
  sampleData: invoiceDeleteData,
});
