import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { ynabCommon } from './lib/common';
import { createTransaction } from './lib/actions/create-transaction';
import { budgetToCategory } from './lib/actions/budget-to-category';
import { lowCategoryBalance } from './lib/triggers/low-category-balance';

export const ynabAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  required: true,
  description: `
    To obtain your personal token, follow these steps:

    1. Log in to your YNAB account.
    2. Visit https://app.ynab.com/settings/developer to create one.
    3. Click on "New Token", enter your password and click "Generate".
    4. Copy the token.
    `,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${ynabCommon.apiUrl}/budgets`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API token',
      };
    }
  },
});

export const ynab = createPiece({
  displayName: 'YNAB',
  description: 'Integrate with the YNAB API',
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ynab.png',
  auth: ynabAuth,
  authors: ['guzart'],
  actions: [createTransaction, budgetToCategory],
  triggers: [lowCategoryBalance],
});
