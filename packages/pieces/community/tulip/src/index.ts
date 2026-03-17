import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTulipPrice } from './lib/actions/get-tulip-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const tulip = createPiece({
  displayName: 'Tulip Protocol',
  description:
    'Solana yield aggregator that auto-compounds farming rewards across multiple DeFi protocols. Fetch TVL, token price, chain breakdown, historical TVL, and protocol stats via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tulip.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getTulipPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
