
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { formitableTriggers } from './lib/triggers';

const markdown = `
To obtain your API key:

1. Log in to your Formitable account
2. Go to **Settings > Team**
3. Create an API Key for your user
4. Copy and paste the key here
`;

export const formitableAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.formitable.com/api/v1.2/restaurants',
        headers: {
          ApiKey: auth,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const formitable = createPiece({
  displayName: 'Formitable',
  description: 'Restaurant reservation and guest management platform',
  auth: formitableAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/formitable.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [],
  triggers: formitableTriggers,
});