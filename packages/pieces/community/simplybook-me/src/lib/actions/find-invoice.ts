import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const findInvoiceAction = createAction({
  auth: simplyBookAuth,
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Find invoices based on search criteria',
  props: {
    invoiceId: Property.Number({
      displayName: 'Invoice ID',
      description: 'Specific invoice ID to find (optional)',
      required: false,
    }),
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'Filter by client ID (optional)',
      required: false,
    }),
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'Filter by booking ID (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by invoice status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Filter invoices from this date (optional)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Filter invoices until this date (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of invoices to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { invoiceId, clientId, bookingId, status, startDate, endDate, limit } = context.propsValue;
    
    // If specific invoice ID is provided, get that invoice
    if (invoiceId) {
      return await makeApiRequest(context.auth, 'getInvoice', { invoice_id: invoiceId });
    }
    
    // Otherwise, search for invoices
    const params: Record<string, any> = {
      ...(clientId && { client_id: clientId }),
      ...(bookingId && { booking_id: bookingId }),
      ...(status && { status }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      limit: limit || 50,
    };

    return await makeApiRequest(context.auth, 'getInvoices', params);
  },
});
