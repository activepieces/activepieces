import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getInjPrice } from './lib/actions/get-inj-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const injective = createPiece({
  displayName: 'Injective',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/injective.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Injective is a Layer-1 blockchain built for DeFi, featuring a fully on-chain order book DEX, derivatives trading, and cross-chain compatibility. Access real-time TVL, price, and protocol analytics powered by DeFiLlama and CoinGecko.',
  actions: [
    getProtocolTvl,
    getInjPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
