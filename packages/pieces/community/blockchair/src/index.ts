import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getBlockchainStats } from './lib/actions/get-blockchain-stats';
import { getAddressDashboard } from './lib/actions/get-address-dashboard';
import { getTransaction } from './lib/actions/get-transaction';
import { getBlock } from './lib/actions/get-block';
import { search } from './lib/actions/search';

export const blockchair = createPiece({
  displayName: 'Blockchair',
  description:
    'Multi-chain blockchain explorer and analytics for Bitcoin, Ethereum, Litecoin, Dogecoin, and 10+ more chains.',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description:
      'Optional Blockchair API key for higher rate limits. Leave empty to use the free tier.',
    required: false,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/blockchair.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getBlockchainStats,
    getAddressDashboard,
    getTransaction,
    getBlock,
    search,
  ],
  triggers: [],
});
