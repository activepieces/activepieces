import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const retrieveAnInvoice = createAction({
  auth: stripeAuth,
  name: 'retrieveAnInvoice',
  displayName: 'Retrieve an Invoice',
  description: 'Retrieves an invoice by its ID.',
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      required: true,
    }),
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