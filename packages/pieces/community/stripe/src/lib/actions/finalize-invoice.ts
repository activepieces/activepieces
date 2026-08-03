import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { invoiceOutputSchema } from '../output-schemas';
export const stripeFinalizeInvoice = createAction({
  name: 'finalize_invoice',
  auth: stripeAuth,
  displayName: 'Finalize Invoice (Agent)',
  description: 'Finalize a draft invoice so it becomes payable.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finalizes a draft Stripe invoice, locking its line items and making it payable. Use after adding all line items and before Send Invoice. Not idempotent: it errors if the invoice is already finalized.',
    idempotent: false,
  },
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The draft invoice ID (e.g., in_...). Obtain it from List/Search Invoices.',
      required: true,
    }),
    auto_advance: Property.Checkbox({
      displayName: 'Auto Advance',
      description:
        'If true, Stripe automatically collects the invoice (sends/charges per its settings) after finalizing.',
      required: false,
    }),
  },
  outputSchema: invoiceOutputSchema,
  async run(context) {
    const { invoice_id, auto_advance } = context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (auto_advance !== undefined) body.auto_advance = auto_advance;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}/finalize`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
