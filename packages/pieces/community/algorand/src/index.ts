import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAlgoPrice } from './lib/actions/get-algo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const algorand = createPiece({
  displayName: 'Algorand',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/algorand.png',
  authors: ['bossco7598'],
  description:
    'Algorand is a high-performance, pure proof-of-stake Layer-1 blockchain with fast finality and low fees. ALGO is the native token. Access DeFiLlama TVL data and CoinGecko price feeds — no API key required.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getAlgoPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
