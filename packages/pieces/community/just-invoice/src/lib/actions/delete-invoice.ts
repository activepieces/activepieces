import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const deleteInvoice = createAction({
  auth: justInvoiceAuth,
  name: 'delete_invoice',
  displayName: 'Delete Invoice',
  description: 'Permanently deletes an invoice',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID or invoice number of the invoice to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.DELETE,
      endpoint: `/api/invoices/${invoiceId}`,
    });

    return response;
  },
});
