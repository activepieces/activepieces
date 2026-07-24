import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { creditNoteOutputSchema } from '../output-schemas';
export const stripeGetCreditNote = createAction({
  name: 'get_credit_note',
  auth: stripeAuth,
  displayName: 'Get Credit Note (Agent)',
  description: 'Retrieve a credit note by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single credit note by its ID (e.g., cn_...), including its line items. Use List Credit Notes to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    credit_note_id: Property.ShortText({
      displayName: 'Credit Note ID',
      description:
        'The credit note ID (e.g., cn_...). Obtain it from List Credit Notes.',
      required: true,
    }),
  },
  outputSchema: creditNoteOutputSchema,
  async run(context) {
    const { credit_note_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/credit_notes/${credit_note_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
