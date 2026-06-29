import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeVoidCreditNote = createAction({
  name: 'void_credit_note',
  auth: stripeAuth,
  displayName: 'Void Credit Note (Agent)',
  description: 'Void a credit note.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Voids a Stripe credit note, reversing the credit/refund it represented. Not idempotent: it errors if the credit note is already void.',
    idempotent: false,
  },
  props: {
    credit_note_id: Property.ShortText({
      displayName: 'Credit Note ID',
      description:
        'The credit note ID (e.g., cn_...). Obtain it from List Credit Notes.',
      required: true,
    }),
  },
  async run(context) {
    const { credit_note_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/credit_notes/${credit_note_id}/void`,
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
