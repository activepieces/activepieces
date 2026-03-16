import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBifiPrice } from './lib/actions/get-bifi-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const beefyFinance = createPiece({
  displayName: 'Beefy Finance',
  description:
    'Beefy Finance is a multichain yield optimizer that auto-compounds yield farming rewards across 25+ blockchains, maximizing APY through automated vault strategies.',
  logoUrl: 'https://cdn.activepieces.com/pieces/beefy-finance.png',
  minimumSupportedRelease: '0.20.0',
  authors: ['bossco7598'],
  auth: PieceAuth.None(),
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getBifiPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
