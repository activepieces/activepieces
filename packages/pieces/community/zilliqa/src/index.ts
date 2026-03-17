import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getZilPrice } from './lib/actions/get-zil-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const zilliqa = createPiece({
  displayName: 'Zilliqa',
  description:
    'Zilliqa is a high-throughput Layer-1 blockchain using sharding technology. ZIL is the native token. Access TVL, price, and protocol data via DeFiLlama and CoinGecko.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zilliqa.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getZilPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
