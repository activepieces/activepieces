import { PieceAuth } from '@activepieces/pieces-framework';
import { shortIoApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const shortIoAuth = PieceAuth.CustomAuth({
  description: 'Enter your Short.io API Key',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await shortIoApiCall({
        method: HttpMethod.GET,
        auth: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        },
        resourceUri: '/api/domains',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
  required: true,
});
