import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const newInvoiceTrigger = createTrigger({
  auth: simplyBookAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is generated/paid (with Accept Payments feature)',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 98765,
    client_id: 67890,
    booking_id: 12345,
    invoice_number: 'INV-2023-001',
    amount: 150.00,
    currency: 'USD',
    status: 'paid',
    due_date: '2023-12-15T23:59:59Z',
    paid_at: '2023-11-28T14:30:00Z',
    created_at: '2023-11-28T14:30:00Z',
  },
  async onEnable(context) {
    // Store the current timestamp to track new invoices
    await context.store.put('last_invoice_check', new Date().toISOString());
  },
  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('last_invoice_check');
  },
  async run(context) {
    const lastCheck = await context.store.get<string>('last_invoice_check');
    const now = new Date().toISOString();
    
    const params: Record<string, any> = {
      start_date: lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_date: now,
    };

    const invoices = await makeApiRequest(context.auth, 'getInvoices', params);
    
    // Filter for invoices created since last check
    const newInvoices = (invoices || []).filter((invoice: any) => 
      invoice.created_at && invoice.created_at > lastCheck
    );
    
    // Update the last check timestamp
    await context.store.put('last_invoice_check', now);
    
    return newInvoices;
  },
});
