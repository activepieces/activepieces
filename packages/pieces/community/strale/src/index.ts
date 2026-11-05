import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { straleAuth } from './lib/auth';
import { searchCapabilities } from './lib/actions/search';
import { executeCapability } from './lib/actions/execute';
import { checkBalance } from './lib/actions/balance';

export const strale = createPiece({
  displayName: 'Strale',
  description:
    'Pay-per-call tools for AI agents: company records, compliance screening, IBAN and VAT validation, document extraction and web reading. Results are structured and carry the provenance of the data returned.',
  auth: straleAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/strale.png',
  authors: ['petterlindstrom79', 'sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    searchCapabilities,
    executeCapability,
    checkBalance,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.strale.io',
      auth: straleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
