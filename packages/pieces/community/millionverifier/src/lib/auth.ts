import { PieceAuth } from '@activepieces/pieces-framework';

export const millionVerifierAuth = PieceAuth.SecretText({
  displayName: 'MillionVerifier API Key',
  description: `API Key for MillionVerifier.

API key you can find on this page: https://app.millionverifier.com/api

**Test API key for development:** \`API_KEY_FOR_TEST\`. This API key will return random results.`,
  required: true,
});
