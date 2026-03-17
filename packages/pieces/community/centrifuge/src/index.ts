import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCfgPrice } from './lib/actions/get-cfg-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const centrifuge = createPiece({
  displayName: 'Centrifuge',
  description:
    'Real-world asset (RWA) tokenization protocol. Fetch TVL, CFG token price, chain breakdown, and historical data via DeFiLlama and CoinGecko.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://assets.coingecko.com/coins/images/17927/small/centrifuge.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getCfgPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});

export default centrifuge;
