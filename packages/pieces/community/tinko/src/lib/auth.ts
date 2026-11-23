import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { TinkoApiError, TinkoChannel, TinkoListResponse, tinkoClient } from './common/client';

export const tinkoAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your API token:
1. Sign in to Tinko as an administrator.
2. Open **Configurações > API** (Settings > API) at https://app.tinko.com.br/settings/api.
3. Create a token and copy it. The token has 64 letters and numbers.

API access depends on your Tinko plan. API reference: https://docs.tinko.com.br`,
  required: true,
  validate: async ({ auth }) => {
    const result = await tryCatch(() =>
      tinkoClient.request<TinkoListResponse<TinkoChannel>>({
        token: auth,
        method: HttpMethod.GET,
        path: '/channels',
        queryParams: { per_page: '1' },
      })
    );
    if (!result.error) {
      return { valid: true };
    }
    if (result.error instanceof TinkoApiError && result.error.status === 401) {
      return { valid: false, error: 'Invalid API token. Copy it again from Configurações > API in Tinko.' };
    }
    return { valid: false, error: result.error.message };
  },
});
