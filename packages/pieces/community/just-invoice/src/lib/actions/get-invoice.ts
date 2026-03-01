import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const getInvoice = createAction({
  auth: justInvoiceAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description: 'Gets detailed information about a specific invoice',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID or invoice number of the invoice to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await justInvoiceApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: `/api/invoices/${invoiceId}`,
    });

    return response;
  },
});
