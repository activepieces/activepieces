import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBncPrice } from './lib/actions/get-bnc-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const bifrost = createPiece({
  displayName: 'Bifrost Finance',
  description:
    'Bifrost is a liquid staking protocol in the Polkadot/Kusama ecosystem offering vTokens (vDOT, vKSM, vBNB, vETH) as liquid staking derivatives.',
  auth: undefined,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bifrost.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getBncPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
