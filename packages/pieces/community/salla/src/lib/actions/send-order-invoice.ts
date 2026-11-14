import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const sendOrderInvoiceAction = createAction({
  auth: sallaAuth,
  name: 'send_order_invoice',
  classification: 'WRITE',
  displayName: 'Send Order Invoice',
  description: 'Sends the order invoice to the customer. Salla sends invoices only for orders whose status is Completed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Makes Salla send the invoice of one order, by its internal order ID (2116149737), to the customer on the order. Salla sends invoices only for orders whose status is Completed and rejects any other order. Use Get Order Invoice PDF instead when you only need the PDF link. Each call sends the invoice again, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.sendInvoice,
  props: {
    order: sallaProps.order({ required: true }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.sendInvoice({ auth, orderId: propsValue.order });
  },
});
