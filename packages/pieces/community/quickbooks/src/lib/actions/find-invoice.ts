import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { runQBQuery, QBInvoice } from '../common';

export const quickbooksFindInvoice = createAction({
  auth: quickbooksAuth,
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Searches for invoices in QuickBooks by customer ID, invoice number, or date range.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter invoices by customer ID.',
      required: false,
    }),
    doc_number: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Filter by invoice document number (e.g., INV-1001).',
      required: false,
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description: 'Filter invoices on or after this date (YYYY-MM-DD).',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description: 'Filter invoices on or before this date (YYYY-MM-DD).',
      required: false,
    }),
    unpaid_only: Property.Checkbox({
      displayName: 'Unpaid Only',
      description: 'If enabled, returns only invoices with an outstanding balance.',
      required: false,
      defaultValue: false,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      realm_id,
      customer_id,
      doc_number,
      date_from,
      date_to,
      unpaid_only,
      use_sandbox,
    } = context.propsValue;

    const whereClauses: string[] = [];

    if (customer_id) {
      whereClauses.push(`CustomerRef = '${customer_id}'`);
    }
    if (doc_number) {
      whereClauses.push(`DocNumber = '${doc_number.replace(/'/g, "\\'")}'`);
    }
    if (date_from) {
      whereClauses.push(`TxnDate >= '${date_from}'`);
    }
    if (date_to) {
      whereClauses.push(`TxnDate <= '${date_to}'`);
    }
    if (unpaid_only) {
      whereClauses.push(`Balance > '0.00'`);
    }

    const whereStr = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT * FROM Invoice${whereStr} ORDERBY MetaData.CreateTime DESC MAXRESULTS 20`;

    const invoices = await runQBQuery<QBInvoice>(
      context.auth as any,
      realm_id,
      query,
      use_sandbox ?? false
    );

    return invoices;
  },
});
