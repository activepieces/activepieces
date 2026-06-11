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
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single invoice by its Qawafel invoice id (the `inv_` identifier), including line items, totals, current state, and the ZATCA PDF URL. Use when you have an invoice id and need its current details or the PDF link. Read-only and idempotent.',
    idempotent: true,
  },
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
