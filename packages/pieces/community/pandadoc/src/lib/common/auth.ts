import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocRequest } from './client';

export const pandadocAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Your PandaDoc API key.

1. In PandaDoc, open **Settings > Integrations > API** (the Developer Dashboard).
2. Copy the **Sandbox** key for testing or the **Production** key for live documents.
3. Paste it here.

Sandbox keys are limited to 10 requests per minute and can only send documents to email addresses in your own domain.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await pandadocRequest({ apiKey: auth, method: HttpMethod.GET, path: '/members/current' });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not validate the PandaDoc API key.',
      };
    }
  },
});
