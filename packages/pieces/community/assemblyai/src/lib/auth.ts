import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { baseUrl } from './client';

export const assemblyaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'You can retrieve your AssemblyAI API key within your AssemblyAI [Account Settings](https://www.assemblyai.com/app/account?utm_source=activepieces).',
  validate: async ({ auth }) => {
    if (!auth)
      return {
        valid: false,
        error: 'The AssemblyAI API key is required.',
      };
    try {
      const res = await httpClient.sendRequest<string[]>({
        method: HttpMethod.GET,
        url: `${baseUrl}/v2/account`,
        headers: {
          Authorization: auth,
        },
      });
      if (res.status !== 200)
        return {
          valid: false,
          error: 'The AssemblyAI API key is invalid.',
        };
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'The AssemblyAI API key is invalid.',
      };
    }
  },
});
