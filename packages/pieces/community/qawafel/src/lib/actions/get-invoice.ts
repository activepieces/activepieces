import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';

export const getInvoice = createAction({
  auth: qawafelAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description:
    'Fetch a single invoice by its Qawafel ID. Returns the full invoice including line items, totals, ZATCA PDF URL, and current state.',
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The Qawafel invoice ID (starts with `inv_`). Find this in a webhook payload, the "List Invoices" action, or the dashboard.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.GET,
      path: `/invoices/${propsValue.invoice_id}`,
    });
    return response.body;
  },
});
