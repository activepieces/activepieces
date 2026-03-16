import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getOrcaPrice } from './lib/actions/get-orca-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const orca = createPiece({
  displayName: 'Orca',
  auth: PieceAuth.None(),
  description:
    'Orca is the leading DEX on Solana known for its concentrated liquidity Whirlpools. Fetch TVL, price, chain breakdown, historical data, and protocol stats — all from free public APIs.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/orca.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getOrcaPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
