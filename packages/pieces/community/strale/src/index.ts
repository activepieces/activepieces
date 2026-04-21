import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { straleAuth } from './lib/auth';
import { searchCapabilities } from './lib/actions/search';
import { executeCapability } from './lib/actions/execute';
import { checkBalance } from './lib/actions/balance';
import { trustProfile } from './lib/actions/trust-profile';

export const strale = createPiece({
  displayName: 'Strale',
  description:
    'Trust layer for AI agents. 271 quality-scored API capabilities: company verification across 27 countries, sanctions screening, IBAN/VAT validation, web intelligence, and more. Every result includes a quality score and audit trail.',
  auth: straleAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/strale.png',
  authors: ['petterlindstrom79', 'sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    searchCapabilities,
    executeCapability,
    checkBalance,
    trustProfile,
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
