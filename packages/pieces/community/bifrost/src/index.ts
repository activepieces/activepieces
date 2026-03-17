import { PieceAuth, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBncPrice } from './lib/actions/get-bnc-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const bifrost = createPiece({
  displayName: 'Bifrost',
  description:
    'Bifrost is a Polkadot parachain providing multi-chain liquid staking for DOT, KSM, ETH, BNB, GLMR, FIL and more. Access real-time TVL, BNC price, chain breakdowns, and historical data.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://icons.llama.fi/bifrost-liquid-staking.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getBncPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
