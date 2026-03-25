import { createAction, Property } from '@activepieces/pieces-framework';
import { millionVerifierAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
export const verifyEmail = createAction({
  auth: millionVerifierAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verify email address using Million Verifier API',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Timeout in seconds (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { email, timeout = 10 } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const params = new URLSearchParams({
      api: apiKey,
      email: email,
      timeout: timeout.toString(),
    });
    const url = `https://millionverifier.com/api/v3/?${params.toString()}`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
    });

    return response.body;
  },
});
