import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { budgetToCategory } from './lib/actions/budget-to-category';
import { createTransaction } from './lib/actions/create-transaction';
import { ynabAuth } from './lib/auth';
import { YNAB_BASE_URL } from './lib/common';
export const ynab = createPiece({
  displayName: 'YNAB',
  description:
    'You Need A Budget — personal budgeting software for tracking spending, budgeting to categories, and reaching financial goals.',
  auth: ynabAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ynab.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['sanket-a11y'],
  actions: [
    createTransaction,
    budgetToCategory,
    createCustomApiCallAction({
      baseUrl: () => YNAB_BASE_URL,
      auth: ynabAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
