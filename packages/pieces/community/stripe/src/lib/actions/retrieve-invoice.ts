import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeRetrieveInvoice = createAction({
  name: 'retrieve_invoice',
  auth: stripeAuth,
  displayName: 'Retrieve an Invoice',
  description: 'Retrieves the details of an existing invoice by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full details of a single Stripe invoice by its invoice ID (e.g., in_...). Use when you have the exact invoice ID and need its current status, amounts, or hosted/PDF links. Read-only and idempotent.',
    idempotent: true,
  },
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
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});
