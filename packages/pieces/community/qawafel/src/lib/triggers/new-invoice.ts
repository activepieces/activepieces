import { createQawafelEventTrigger } from '../common/webhooks';

export const newInvoice = createQawafelEventTrigger({
  name: 'new_invoice',
  displayName: 'New Invoice Generated',
  description:
    'Fires when a ZATCA-compliant invoice is finalized in Qawafel (the `invoice.generated` event). Use it to email PDFs to customers, archive invoices to Drive, or push to your accounting system.',
  event: 'invoice.generated',
  sampleData: {
    id: 'inv_01jk5jtv3x6e5hjkfcwzvubejq',
    invoice_number: 'INV-000123',
    merchant_id: 'mer_01jk5jtv3x2zbdroz75n3eczi4',
    order_id: 'ord_01jk5jtv3x6e5hjkfcwzvubejq',
    state: 'pushed',
    issue_date: '2026-04-25',
    due_date: '2026-05-25',
    line_items: [
      {
        id: 'ili_01jk5jtv3x6e5hjkfcwzvubejq',
        product_id: 'prod_01jk5jtv3x6e5hjkfcwzvubejq',
        quantity: 2,
        unit_price: '99.00',
        vat_percentage: '15.00',
        total: '227.70',
      },
    ],
    totals: {
      subtotal: '198.00',
      vat_amount: '29.70',
      total: '227.70',
    },
    zatca_pdf_url: 'https://core.qawafel.sa/invoices/inv_xxx.pdf',
    external_ref: null,
    created_at: '2026-04-25T10:15:00Z',
    updated_at: '2026-04-25T10:15:00Z',
  },
});
