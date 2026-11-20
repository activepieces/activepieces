import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { HermosoApiError, hermosoApi } from './common/client';

export const hermosoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in at [app.hermoso.ai](https://app.hermoso.ai).
2. Open **MCP & CLI** and create a key.
3. Copy the key (it starts with \`hmk_\`) and paste it here.

More detail is in the [API guide](https://hermoso.ai/docs/api/).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await readEmail(auth);
      return { valid: true };
    } catch (e) {
      if (e instanceof HermosoApiError && (e.status === 401 || e.status === 403)) {
        return { valid: false, error: 'Hermoso did not accept this API key.' };
      }
      return { valid: false, error: 'Could not reach Hermoso to check the API key. Try again.' };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const address = await readEmail(auth);
      return address || undefined;
    } catch {
      return undefined;
    }
  },
});

async function readEmail(apiKey: string): Promise<string> {
  const response = await hermosoApi.send<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/account/email',
  });
  return hermosoApi.isRecord(response.body) ? hermosoApi.text(response.body['address']) : '';
}
