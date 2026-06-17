import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellApiCall } from './lib/common/client';
import { createCustomer } from './lib/actions/create-customer';
import { updateCustomer } from './lib/actions/update-customer';
import { listCustomers } from './lib/actions/list-customers';
import { getCustomer } from './lib/actions/get-customer';
import { searchProducts } from './lib/actions/search-products';
import { createProduct } from './lib/actions/create-product';
import { updateProduct } from './lib/actions/update-product';

export const quizellAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your Quizell API token:
1. Log in to your [Quizell](https://quizell.com) account.
2. Go to **Settings** in the left sidebar.
3. Navigate to **API & Integrations**.
4. Copy your API token from there.

Need help? See [Quizell API Docs](https://docs.quizell.com).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await quizellApiCall({
        token: auth,
        method: HttpMethod.GET,
        path: '/customers/list',
        queryParams: { per_page: '1', page: '1' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API token. Please check your credentials and try again.' };
    }
  },
});

export const quizell = createPiece({
  displayName: 'Quizell',
  description: 'Quiz-based product recommendation and lead capture platform.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/quizell.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMERCE],
  auth: quizellAuth,
  authors: ['sanket-a11y'],
  actions: [
    createCustomer,
    updateCustomer,
    listCustomers,
    getCustomer,
    searchProducts,
    createProduct,
    updateProduct,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.quizell.com/api/v1',
      auth: quizellAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
