import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const getOrderInvoicePdfAction = createAction({
  auth: sallaAuth,
  name: 'get_order_invoice_pdf',
  classification: 'READ',
  displayName: 'Get Order Invoice PDF',
  description: 'Gets a link to the printable PDF invoice of an order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Asks Salla to render the invoice of one order, by its internal order ID (2116149737), and returns the link to the PDF exactly as Salla sends it, which can be a path relative to the store. Use Send Order Invoice instead to have Salla send the invoice to the customer. Nothing is sent to the customer and it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.invoicePdf,
  props: {
    order: sallaProps.order({ required: true }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.getInvoicePdf({ auth, orderId: propsValue.order });
  },
});
