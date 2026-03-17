import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { createQBEntity, QBInvoice } from '../common';

export const quickbooksCreateInvoice = createAction({
  auth: quickbooksAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice in QuickBooks.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The QuickBooks ID of the customer to invoice.',
      required: true,
    }),
    txn_date: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Date of the invoice (YYYY-MM-DD). Defaults to today.',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for payment (YYYY-MM-DD).',
      required: false,
    }),
    line_items: Property.Json({
      displayName: 'Line Items',
      description: `Array of line items. Each item should include:
\`\`\`json
[
  {
    "Description": "Consulting Services",
    "Amount": 500.00,
    "Qty": 5,
    "UnitPrice": 100.00,
    "ItemRef": "1"
  }
]
\`\`\`
**ItemRef** is the QuickBooks Item/Service ID. Amount = Qty × UnitPrice.`,
      required: true,
    }),
    doc_number: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Custom invoice number (e.g. INV-1001). Auto-generated if left blank.',
      required: false,
    }),
    customer_memo: Property.ShortText({
      displayName: 'Customer Memo',
      description: 'Message displayed on the invoice for the customer.',
      required: false,
    }),
    private_note: Property.ShortText({
      displayName: 'Private Note',
      description: 'Internal note not visible to the customer.',
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'Send Email To',
      description: 'If provided, QuickBooks will send the invoice to this email address.',
      required: false,
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
      txn_date,
      due_date,
      line_items,
      doc_number,
      customer_memo,
      private_note,
      email_address,
      use_sandbox,
    } = context.propsValue;

    // Build line items for QuickBooks API format
    const rawLines = Array.isArray(line_items) ? line_items : [line_items];
    const lines = rawLines.map((item: Record<string, unknown>) => {
      const lineItem: Record<string, unknown> = {
        Amount: item['Amount'],
        DetailType: 'SalesItemLineDetail',
        Description: item['Description'],
        SalesItemLineDetail: {
          Qty: item['Qty'] ?? 1,
          UnitPrice: item['UnitPrice'] ?? item['Amount'],
        },
      };

      if (item['ItemRef']) {
        (lineItem['SalesItemLineDetail'] as Record<string, unknown>)['ItemRef'] = {
          value: item['ItemRef'],
        };
      }

      return lineItem;
    });

    const body: Record<string, unknown> = {
      CustomerRef: { value: customer_id },
      Line: lines,
    };

    if (txn_date) body['TxnDate'] = txn_date;
    if (due_date) body['DueDate'] = due_date;
    if (doc_number) body['DocNumber'] = doc_number;
    if (customer_memo) body['CustomerMemo'] = { value: customer_memo };
    if (private_note) body['PrivateNote'] = private_note;
    if (email_address) {
      body['BillEmail'] = { Address: email_address };
      body['EmailStatus'] = 'NeedToSend';
    }

    const invoice = await createQBEntity<QBInvoice>(
      context.auth as any,
      realm_id,
      'invoice',
      body,
      use_sandbox ?? false
    );

    return invoice;
  },
});
