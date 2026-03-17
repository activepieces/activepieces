import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getOgnPrice } from './lib/actions/get-ogn-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const originProtocol = createPiece({
  displayName: 'Origin Protocol',
  description: 'OUSD/OETH liquid staking and yield data via DeFiLlama and CoinGecko APIs',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/origin-protocol.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  actions: [
    getProtocolTvl,
    getOgnPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
