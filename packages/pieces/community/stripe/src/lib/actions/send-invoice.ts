import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { invoiceOutputSchema } from '../output-schemas';
export const stripeSendInvoice = createAction({
  name: 'send_invoice',
  auth: stripeAuth,
  displayName: 'Send Invoice (Agent)',
  description: 'Email a finalized invoice to the customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Emails a finalized Stripe invoice to the customer. The invoice must already be finalized (use Finalize Invoice first). Not idempotent: each call sends the invoice email again.',
    idempotent: false,
  },
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The finalized invoice ID (e.g., in_...). Obtain it from List/Search Invoices.',
      required: true,
    }),
  },
  outputSchema: invoiceOutputSchema,
  async run(context) {
    const { invoice_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}/send`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {},
    });

    return response.body;
  },
});
