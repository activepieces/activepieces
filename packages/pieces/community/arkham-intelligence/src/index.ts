import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getAddressIntelligenceAction } from './lib/actions/get-address-intelligence';
import { getTransactionsAction } from './lib/actions/get-transactions';
import { getEntityAction } from './lib/actions/get-entity';
import { getTopHoldersAction } from './lib/actions/get-top-holders';
import { getAddressTransfersAction } from './lib/actions/get-address-transfers';

export const arkhamAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Arkham Intelligence API key. Get one at https://platform.arkhamintelligence.com/settings/api',
  required: true,
});

export const arkhamIntelligence = createPiece({
  displayName: 'Arkham Intelligence',
  description: 'Crypto wallet entity profiling and on-chain intelligence. Identify who controls wallets, track transactions, analyze token holdings, and monitor money flows across blockchains.',
  auth: arkhamAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/arkham-intelligence.png',
  authors: ['Bossco'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getAddressIntelligenceAction,
    getTransactionsAction,
    getEntityAction,
    getTopHoldersAction,
    getAddressTransfersAction,
  ],
  triggers: [],
});
