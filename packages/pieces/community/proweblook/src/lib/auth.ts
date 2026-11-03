import { PieceAuth } from '@activepieces/pieces-framework';
import { proweblookApi } from './common/client';
import { GetBalanceData } from './common/types';

export const proweblookAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your ProWebLook API key. Find or generate your API key in your [ProWebLook Profile](https://proweblook.com/user/my_profile).',
  required: true,
  validate: async ({ auth }) => {
    const apiKey = auth.trim();
    if (!apiKey) {
      return {
        valid: false,
        error: 'API key cannot be empty.',
      };
    }

    try {
      await proweblookApi.post<GetBalanceData>({
        apiKey,
        operation: 'get_balance',
        body: {},
      });
      return { valid: true };
    } catch (error) {
      const status = proweblookApi.statusOf(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            'ProWebLook rejected this API key. Check that your key is active at https://proweblook.com/user/my_profile.',
        };
      }
      return {
        valid: false,
        error: `Could not validate ProWebLook API key: ${proweblookApi.describeError(
          error,
          'unexpected error'
        )}`,
      };
    }
  },
});
