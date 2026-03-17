import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getOnePrice } from './lib/actions/get-one-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const harmony = createPiece({
  displayName: 'Harmony (ONE)',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/harmony.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  description:
    'Harmony is a fast and open blockchain for decentralized applications. It uses Effective Proof-of-Stake (EPoS) and sharding to achieve scalability. ONE is the native token. Fetch TVL data from DeFiLlama and price data from CoinGecko.',
  actions: [
    getProtocolTvl,
    getOnePrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
