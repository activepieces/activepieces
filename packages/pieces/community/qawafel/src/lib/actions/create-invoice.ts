import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { InvoiceLineItemInput, qawafelProps } from '../common/props';

export const createInvoice = createAction({
  auth: qawafelAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description:
    'Create an invoice in Qawafel for a customer. The invoice starts in `draft` state — use the **Generate Invoice** action (or call it from your dashboard) to finalize and issue a ZATCA-compliant copy.',
  props: {
    merchant_id: qawafelProps.merchantDropdown({
      displayName: 'Customer',
      description: 'The customer being invoiced.',
      required: true,
      type: 'customer',
    }),
    issue_date: Property.DateTime({
      displayName: 'Issue Date',
      description:
        'The date the invoice is issued. Use today for most cases. (YYY-MM-DD format)',
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When payment is due. (YYY-MM-DD format)',
      required: true,
    }),
    line_items: qawafelProps.invoiceLineItemsArray,
    order_id: Property.ShortText({
      displayName: 'Linked Order ID',
      description:
        'Optional. The Qawafel order ID (`ord_…`) this invoice is for. Linking helps track fulfilment-to-billing.',
      required: false,
    }),
    shipping_fees: Property.ShortText({
      displayName: 'Shipping Fees (SAR)',
      description:
        'Optional. Delivery / shipping fees as a decimal string excluding VAT, e.g. `25.00`. Defaults to `0.00`.',
      required: false,
    }),
    payment_start_date: Property.DateTime({
      displayName: 'Payment Window Start',
      description: 'Optional. When the payment terms begin. (YYY-MM-DD format)',
      required: false,
    }),
    payment_due_date: Property.DateTime({
      displayName: 'Final Payment Due Date',
      description:
        'Optional. The absolute final date payment is due (used for late-payment workflows). (YYY-MM-DD format)',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Optional. Notes printed on the invoice or kept internal.',
      required: false,
    }),
    external_ref: qawafelProps.externalRef('Your Reference ID'),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const lineItems = (propsValue.line_items ?? []) as InvoiceLineItemInput[];

    const body: Record<string, unknown> = {
      merchant_id: propsValue.merchant_id,
      issue_date: toDate(propsValue.issue_date),
      due_date: toDate(propsValue.due_date),
      line_items: lineItems,
    };
    if (propsValue.order_id) {
      body['order_id'] = propsValue.order_id;
    }
    if (propsValue.shipping_fees) {
      body['shipping_fees'] = propsValue.shipping_fees;
    }
    if (propsValue.payment_start_date) {
      body['payment_start_date'] = toDate(propsValue.payment_start_date);
    }
    if (propsValue.payment_due_date) {
      body['payment_due_date'] = toDate(propsValue.payment_due_date);
    }
    if (propsValue.notes) {
      body['notes'] = propsValue.notes;
    }
    if (propsValue.external_ref) {
      body['external_ref'] = propsValue.external_ref;
    }

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: '/invoices',
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});

function toDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}
