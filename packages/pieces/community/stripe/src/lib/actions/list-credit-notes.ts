import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { creditNoteListOutputSchema } from '../output-schemas';
export const stripeListCreditNotes = createAction({
  name: 'list_credit_notes',
  auth: stripeAuth,
  displayName: 'List Credit Notes (Agent)',
  description: 'List Stripe credit notes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through credit notes, newest first, optionally filtered by invoice or customer. Use to enumerate credit notes or resolve a credit note ID; use Get Credit Note when you have the cn_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    invoice: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Filter to credit notes for this invoice (in_...).',
      required: false,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to credit notes for this customer (cus_...).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: creditNoteListOutputSchema,
  async run(context) {
    const { invoice, customer, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (invoice) queryParams['invoice'] = invoice;
    if (customer) queryParams['customer'] = customer;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/credit_notes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
