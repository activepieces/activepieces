import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SupabirdMe, supabirdRequest } from './common/client';

const markdownDescription = `
To get your SupaBird API key:
1. Log in to SupaBird at https://x.supabird.io.
2. Go to **Profile > API & Apps** (https://x.supabird.io/dashboard?tab=account&view=api).
3. Create a key and copy it. SupaBird shows the key only once.

API access needs a SupaBird Pro or trial plan.
`;

export const supabirdAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await supabirdRequest<SupabirdMe>({
        token: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not verify the SupaBird API key.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const { body } = await supabirdRequest<SupabirdMe>({
        token: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
      if (!body.name) {
        return undefined;
      }
      return body.x_username ? `${body.name} (@${body.x_username})` : body.name;
    } catch {
      return undefined;
    }
  },
});
