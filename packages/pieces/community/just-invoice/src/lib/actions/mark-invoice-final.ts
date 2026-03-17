import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const markInvoiceFinal = createAction({
  auth: justInvoiceAuth,
  name: 'mark_invoice_final',
  displayName: 'Mark Invoice Final',
  description: 'Marks an invoice currently in draft as final and ready to accept payment',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID or invoice number of the invoice to mark as final',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/api/invoices/${invoiceId}/final`,
    });

    return response;
  },
});
