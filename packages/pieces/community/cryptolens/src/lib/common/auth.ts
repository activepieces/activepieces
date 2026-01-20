import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const CRYPTOLENS_API_BASE_URL = 'https://api.cryptolens.io/api';

async function validateAccessToken(token: string): Promise<boolean> {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${CRYPTOLENS_API_BASE_URL}/auth/GetToken?token=${encodeURIComponent(
        token
      )}`,
    });
    return true;
  } catch {
    return false;
  }
}

export const cryptolensAuth = PieceAuth.SecretText({
  displayName: 'Access Token',
  description:
    'Your Cryptolens access token. Get it from https://app.cryptolens.io/User/AccessToken',
  required: true,
  validate: async ({ auth }) => {
    const isValid = await validateAccessToken(auth);
    if (isValid) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Invalid access token',
    };
  },
});
