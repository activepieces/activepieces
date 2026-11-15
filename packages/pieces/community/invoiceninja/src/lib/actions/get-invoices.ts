import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';
import { invoiceNinjaProps } from '../common/props';

const MAX_RESULTS = 9999;

export const getInvoices = createAction({
  auth: invoiceninjaAuth,
  name: 'getinvoices_task',
  classification: 'SEARCH',
  displayName: 'Get Invoices',
  description: 'Gets invoices by payment status, optionally for one client. Returns false when none match.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyInvoices,
  props: {
    invoiceStatus: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Select the invoice status for filtering.',
      required: true,
      options: {
        options: [
          { label: 'Unpaid Invoices', value: 'unpaid' },
          { label: 'Paid Invoices', value: 'paid' },
          { label: 'Overdue Invoices', value: 'overdue' },
          { label: 'All Invoices', value: 'all' },
        ],
      },
    }),
    clientID: invoiceNinjaProps.clientDropdown({ required: false, displayName: 'Client' }),
    numberOfResults: Property.Number({
      displayName: 'Max Results',
      description: `Maximum number of invoices to return (1-${MAX_RESULTS}). Default ${MAX_RESULTS}.`,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = invoiceNinjaClient.optionalInt({ value: propsValue.numberOfResults, label: 'Max Results', min: 1, max: MAX_RESULTS }) ?? MAX_RESULTS;
    const clientId = invoiceNinjaClient.optionalId({ value: propsValue.clientID, label: 'Client' });
    const collected: unknown[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && collected.length < limit) {
      const result = await invoiceNinjaClient.listPage({
        auth: auth.props,
        entity: 'invoices',
        query: { client_status: propsValue.invoiceStatus || 'unpaid', client_id: clientId, is_deleted: 'false' },
        page,
        perPage: 100,
      });
      collected.push(...result.items);
      hasMore = result.hasMore && result.items.length > 0;
      page += 1;
    }
    const invoices = collected.slice(0, limit).filter(invoiceNinjaClient.isRecord);
    if (invoices.length === 0) return false;
    return invoices.map((invoice) => {
      const first = invoiceNinjaClient.arrayOf(invoice['line_items']).find(invoiceNinjaClient.isRecord);
      return {
        invoice: {
          clientid: invoice['client_id'],
          invoiceno: invoice['number'],
          ponumber: invoice['po_number'],
          invdate: invoice['date'],
          duedate: invoice['due_date'],
          punote: invoice['public_notes'],
          prnote: invoice['private_notes'],
          reminder1: invoice['reminder1_sent'],
          reminder2: invoice['reminder2_sent'],
          reminder3: invoice['reminder3_sent'],
          lastreminder: invoice['reminder_last_sent'],
          firstsku: first ? first['product_key'] : null,
          firstitem: first ? first['notes'] : null,
          amount: invoice['amount'],
          balance: invoice['balance'],
          paid: invoice['paid_to_date'],
        },
      };
    });
  },
});
