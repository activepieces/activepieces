import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCowPrice } from './lib/actions/get-cow-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const cowProtocol = createPiece({
  displayName: 'CoW Protocol',
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cow-protocol.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'CoW Protocol is a DEX aggregator and intent-based trading protocol using batch auctions and Coincidence of Wants (CoW) to find best prices for token swaps.',
  actions: [
    getProtocolTvl,
    getCowPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});