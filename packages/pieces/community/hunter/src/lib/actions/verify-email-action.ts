import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hunterAuth } from '../..';

/**
 * Verify an email address using Hunter's Email Verifier endpoint.
 *
 * This action sends a GET request to the `/email-verifier` endpoint with the
 * provided email address and API key. The response includes detailed
 * verification information such as status, result, and score.
 */
export const hunterVerifyEmailAction = createAction({
  auth: hunterAuth,
  name: 'verify_email',
  displayName: 'Verify Email',
  description:
    'Checks the deliverability of an email address and returns verification details.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email } = propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.hunter.io/v2/email-verifier',
      queryParams: {
        email,
        api_key: auth,
      },
    });
    // The verification data is nested under the `data` property in the response.
    return response.body?.data ?? response.body;
  },
});
