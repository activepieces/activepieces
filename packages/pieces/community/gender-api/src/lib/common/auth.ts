import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { genderApiCommon } from './client';

function readMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Invalid API key.';
}

export const genderApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Gender API authentication token. Sign in at gender-api.com, open your account, go to Authentication Tokens and copy a token. New accounts must confirm their email before the token works.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await genderApiCommon.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/statistic',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: readMessage(error),
      };
    }
  },
});
