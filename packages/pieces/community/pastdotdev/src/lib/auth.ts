import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { pastDevClient } from './common/client';

export const pastDevAuth = PieceAuth.CustomAuth({
  displayName: 'past dev connection',
  description: `Connect a past dev project with a project API key.

1. Sign in to the past dev console.
2. Open the project, then go to **Build › API keys**.
3. Create a key and copy it. The key starts with \`past_sk_\`.
4. Paste the key in **API key**.

Each key belongs to one project. To use another project, create another connection.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      description: 'The project API key. It starts with past_sk_.',
      required: true,
    }),
    apiHost: Property.ShortText({
      displayName: 'API host',
      description:
        'Leave this empty to use https://api.past.dev. Change it only if your company runs past dev in its own cloud.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await pastDevClient.sendRequest({
        connection: { apiKey: auth.apiKey, apiHost: auth.apiHost },
        method: HttpMethod.GET,
        path: '/api/v1/audiences',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
