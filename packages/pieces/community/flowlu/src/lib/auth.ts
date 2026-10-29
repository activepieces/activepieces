import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { FlowluApiError, FlowluClient } from './common/client';

export const flowluAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Log in to your flowlu account.
  2. Click on your profile-pic(top-right) and navigate to **Portal Settings->API Settings**.
  3. Create new API key with any name and appropriate scope.
  4. Copy API Key to your clipboard and paste it in  **API Key** field
  5. In the Domain field, enter your company from your account URL address. For example, if your account URL address is https://example.flowlu.com, then your domain is **example**.
  `,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'Your portal name only, for example "example" for https://example.flowlu.com. A pasted portal URL such as https://example.flowlu.com is also accepted.',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new FlowluClient(auth.domain, auth.apiKey);
      await client.request({
        method: HttpMethod.GET,
        path: '/core/user/list',
        query: { limit: 1 },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof FlowluApiError) {
        if (
          error.status === undefined ||
          error.errorCode === 11 ||
          error.status === 401 ||
          error.status === 403
        ) {
          return { valid: false, error: error.message };
        }
        if (error.status === 200) {
          return { valid: true };
        }
        return { valid: false, error: error.message };
      }
      return {
        valid: false,
        error:
          'Could not reach Flowlu. Check that the Domain is your portal name, for example "example".',
      };
    }
  },
});
