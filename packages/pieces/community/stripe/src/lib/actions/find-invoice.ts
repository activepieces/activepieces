import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeFindInvoice = createAction({
  name: 'find_invoice',
  auth: stripeAuth,
  displayName: 'Find Invoice',
  description: 'Finds an invoice by its unique ID.',
  props: {
    invoice_id: stripeCommon.invoice,
  },
  async run(context) {
    const { invoice_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
