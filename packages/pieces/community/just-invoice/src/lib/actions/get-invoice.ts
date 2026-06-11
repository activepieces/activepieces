import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { justInvoiceAuth } from '../common';
import { justInvoiceApiCall } from '../common/client';

export const getInvoice = createAction({
  auth: justInvoiceAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description: 'Gets detailed information about a specific invoice',
  audience: 'both',
  aiMetadata: { description: 'Retrieves full details of a single JustInvoice invoice by its ID or invoice number. Use to look up an invoice before acting on it or to read its current status. Read-only and idempotent.', idempotent: true },
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
