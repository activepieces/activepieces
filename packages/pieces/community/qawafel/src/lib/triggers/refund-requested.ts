import { createQawafelEventTrigger } from '../common/webhooks';

export const refundRequested = createQawafelEventTrigger({
  name: 'refund_requested',
  displayName: 'Refund / Credit Note Created',
  description:
    'Fires when a credit note is created against an invoice (i.e. a customer return or refund is initiated). Use it to alert your finance team or trigger a return workflow.',
  event: 'credit_note.created',
  sampleData: {
    id: 'cn_01jk5jtv3x6e5hjkfcwzvubejq',
    credit_note_number: 'CN-000123',
    invoice_id: 'inv_01jk5jtv3x6e5hjkfcwzvubejq',
    merchant_id: 'mer_01jk5jtv3x2zbdroz75n3eczi4',
    state: 'draft',
    issue_date: '2026-04-27',
    line_items: [
      {
        id: 'cnli_01jk5jtv3x6e5hjkfcwzvubejq',
        product_id: 'prod_01jk5jtv3x6e5hjkfcwzvubejq',
        quantity: 1,
        unit_price: '99.00',
        vat_percentage: '15.00',
        total: '113.85',
      },
    ],
    totals: {
      subtotal: '99.00',
      vat_amount: '14.85',
      total: '113.85',
    },
    reason: 'Customer return',
    external_ref: null,
    created_at: '2026-04-27T10:15:00Z',
    updated_at: '2026-04-27T10:15:00Z',
  },
});
