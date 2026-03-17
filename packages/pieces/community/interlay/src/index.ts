import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getIntrPrice } from './lib/actions/get-intr-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const interlay = createPiece({
  displayName: 'Interlay',
  description:
    'Trustless Bitcoin bridge and DeFi hub on Polkadot. Use BTC as iBTC in DeFi. Track TVL, INTR token price, chain breakdowns, and protocol stats via DeFiLlama and CoinGecko.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/interlay.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getIntrPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
