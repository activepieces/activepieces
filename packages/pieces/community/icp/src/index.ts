import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getIcpPrice } from './lib/actions/get-icp-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const icp = createPiece({
  displayName: 'Internet Computer (ICP)',
  auth: PieceAuth.None(),
  description:
    'Internet Computer Protocol (ICP) is a Layer-1 blockchain by DFINITY that runs smart contracts at web speed with unlimited capacity. Fetch TVL, price, chain breakdowns, and protocol statistics from DeFiLlama and CoinGecko.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/icp.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getIcpPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
