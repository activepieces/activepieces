import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const markInvoicePaid = createAction({
  auth: justInvoiceAuth,
  name: 'mark_invoice_paid',
  displayName: 'Mark Invoice Paid',
  description: 'Marks an existing final invoice as paid',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID or invoice number of the invoice to mark as paid',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/api/invoices/${invoiceId}/paid`,
    });

    return response;
  },
});
