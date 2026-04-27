import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

export const mixmaxAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Mixmax API token (X-API-Token). Find it at Settings > API in Mixmax.',
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.mixmax.com/v1/users/me',
        headers: { 'X-API-Token': auth },
      }),
    );

    if (error) {
      return { valid: false, error: 'Invalid API token. Please check your Mixmax credentials.' };
    }

    return { valid: true };
  },
});

export type MixmaxAuth = AppConnectionValueForAuthProperty<typeof mixmaxAuth>;
