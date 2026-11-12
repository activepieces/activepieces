import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { CONVERTKIT_API_URL } from './common/constants';
import { kitErrorStatus, kitHttp } from './common/http';

export const convertkitAuth = PieceAuth.SecretText({
  displayName: 'API Secret',
  description:
    'Enter your API Secret key. In Kit, go to Settings > Developer, open the V3 Key section and copy the API Secret.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await kitHttp.sendRequest({
        method: HttpMethod.GET,
        url: `${CONVERTKIT_API_URL}/account`,
        queryParams: { api_secret: auth },
      });
      return { valid: true };
    } catch (error) {
      const status = kitErrorStatus(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Kit rejected this API Secret. Use the V3 API Secret from Kit Settings > Developer, not the API Key or a V4 key.',
        };
      }
      return {
        valid: false,
        error: `Could not check the API Secret with Kit: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});
