import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beamerClient } from './common/client';

export const beamerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Beamer settings',
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      beamerClient.request<unknown>({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
        method: HttpMethod.GET,
        path: '/ping',
      }),
    );
    if (error) {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
    return {
      valid: true,
    };
  },
});
