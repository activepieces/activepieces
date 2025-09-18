import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { InvoiceIdDropdown } from '../common';

export const findInvoice = createAction({
  auth: stripeAuth,
  name: 'findInvoice',
  displayName: 'Find Invoice',
  description: 'Lookup an Invoice by its ID.',
  props: {
    invoiceId: InvoiceIdDropdown
  },
  async run({ auth, propsValue }) {
    const { invoiceId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/invoices/${invoiceId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
