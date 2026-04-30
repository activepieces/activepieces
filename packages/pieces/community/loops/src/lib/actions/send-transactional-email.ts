import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

export const sendTransactionalEmail = createAction({
  name: 'send_transactional_email',
  displayName: 'Send Transactional Email',
  description:
    'Sends a transactional email to a contact using a pre-built template in Loops.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'To Email',
      description: "The recipient's email address.",
      required: true,
    }),
    transactionalId: Property.ShortText({
      displayName: 'Transactional Email ID',
      description:
        'The ID of the transactional email template in Loops (find it in your Loops dashboard).',
      required: true,
    }),
    addToAudience: Property.Checkbox({
      displayName: 'Add to Audience',
      description:
        'If true, the recipient will be added to your Loops audience if they are not already a contact.',
      required: false,
      defaultValue: false,
    }),
    dataVariables: Property.Object({
      displayName: 'Data Variables',
      description:
        'Key-value pairs to populate dynamic variables in your email template (e.g. { "name": "Alice", "resetUrl": "https://..." }).',
      required: false,
    }),
  },
  async run(context) {
    const { email, transactionalId, addToAudience, dataVariables } =
      context.propsValue;

    const body: Record<string, unknown> = {
      email,
      transactionalId,
    };

    if (typeof addToAudience === 'boolean') {
      body['addToAudience'] = addToAudience;
    }

    if (dataVariables && typeof dataVariables === 'object') {
      body['dataVariables'] = dataVariables;
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `${LOOPS_BASE_URL}/transactional`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
