import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTonPrice } from './lib/actions/get-ton-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const ton = createPiece({
  displayName: 'TON (The Open Network)',
  description:
    'TON is a fast, scalable Layer-1 blockchain originally developed by Telegram. Fetch real-time TVL data, price information, chain breakdowns, historical TVL trends, and protocol statistics for the TON ecosystem.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ton.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getTonPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
