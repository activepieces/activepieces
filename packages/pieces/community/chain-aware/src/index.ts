import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { auditWalletAddress } from './lib/actions/audit-wallet-address';
import { creditScore } from './lib/actions/credit-score';
import { fraudCheck } from './lib/actions/fraud-check';
import { rugPullCheck } from './lib/actions/rug-pull-check';
import { walletSegment } from './lib/actions/wallet-segment';
import { BASE_URL } from './lib/common/client';
import { chainAwareAuth } from './lib/common/auth';

export const chainAware = createPiece({
  displayName: 'ChainAware.AI',
  description: 'Detect risky wallet behavior',
  auth: chainAwareAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chain-aware.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    auditWalletAddress,
    creditScore,
    fraudCheck,
    rugPullCheck,
    walletSegment,
    createCustomApiCallAction({
      auth: chainAwareAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'x-api-key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});