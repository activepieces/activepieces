import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { supadataConfig } from './config';

const markdownDescription = `
To obtain your free Supadata API Key, sign up at [Supadata](https://supadata.ai) and then copy the key available in the [dashboard](https://dash.supadata.ai).
`;

export const supadataAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${supadataConfig.baseUrl}/health`,
        headers: {
          [supadataConfig.accessTokenHeaderKey]: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
