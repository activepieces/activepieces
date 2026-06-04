import { createQawafelEventTrigger } from '../common/webhooks';

export const newOrder = createQawafelEventTrigger({
  name: 'new_order',
  displayName: 'New Order',
  description:
    'Fires the moment a new sales order is created in Qawafel. Use it to fan out to fulfillment, accounting, Slack alerts, or your CRM.',
  event: 'order.created',
  sampleData: {
    id: 'ord_01jk5jtv3x6e5hjkfcwzvubejq',
    order_number: 'ORD-000123',
    merchant_id: 'mer_01jk5jtv3x2zbdroz75n3eczi4',
    state: 'pending_vendor_confirmation',
    line_items: [
      {
        id: 'oli_01jk5jtv3x6e5hjkfcwzvubejq',
        product_id: 'prod_01jk5jtv3x6e5hjkfcwzvubejq',
        quantity: 2,
        unit_price: '99.00',
        discount_amount: '0.00',
        vat_amount: '29.70',
        total: '227.70',
      },
    ],
    totals: {
      subtotal: '198.00',
      discount_amount: '0.00',
      amount_excluding_vat: '198.00',
      vat_amount: '29.70',
      total: '227.70',
    },
    delivery: {
      delivery_option: 'courier',
      delivery_fees: '15.00',
      delivery_fees_payer: 'customer',
      net_payable_amount: '242.70',
    },
    notes: null,
    external_ref: null,
    quotation_id: null,
    created_at: '2026-04-27T10:15:00Z',
    updated_at: '2026-04-27T10:15:00Z',
  },
});
