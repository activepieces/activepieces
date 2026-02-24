import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const markInvoiceCancelled = createAction({
  auth: justInvoiceAuth,
  name: 'mark_invoice_cancelled',
  displayName: 'Mark Invoice Cancelled',
  description: 'Marks an invoice currently in final as cancelled',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID or invoice number of the invoice to mark as cancelled',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/api/invoices/${invoiceId}/cancelled`,
    });

    return response;
  },
});
