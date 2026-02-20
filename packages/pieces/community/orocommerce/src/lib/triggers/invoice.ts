import { createOroWebhookTrigger } from '../common/register-webhook';
import { invoiceCreateData, invoiceUpdateData, invoiceDeleteData } from '../examples/invoice';

export const newInvoice = createOroWebhookTrigger({
  name: 'new_invoice',
  description: 'Triggered when a new invoice is created',
  topic: 'invoice',
  event: 'create',
  displayName: 'New Invoice',
  sampleData: invoiceCreateData,
});

export const updatedInvoice = createOroWebhookTrigger({
  name: 'updated_invoice',
  description: 'Triggered when an invoice is updated',
  topic: 'invoice',
  event: 'update',
  displayName: 'Invoice Update',
  sampleData: invoiceUpdateData,
});

export const removedInvoice = createOroWebhookTrigger({
  name: 'removed_invoice',
  description: 'Triggered when an invoice is deleted',
  topic: 'invoice',
  event: 'delete',
  displayName: 'Invoice Removal',
  sampleData: invoiceDeleteData,
});
