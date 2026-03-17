import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvlAction } from './lib/actions/get-protocol-tvl';
import { getPrismaPriceAction } from './lib/actions/get-prisma-price';
import { getChainBreakdownAction } from './lib/actions/get-chain-breakdown';
import { getTvlHistoryAction } from './lib/actions/get-tvl-history';
import { getProtocolStatsAction } from './lib/actions/get-protocol-stats';

export const prismaFinance = createPiece({
  displayName: 'Prisma Finance',
  logoUrl: 'https://cdn.activepieces.com/pieces/prisma-finance.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getProtocolTvlAction,
    getPrismaPriceAction,
    getChainBreakdownAction,
    getTvlHistoryAction,
    getProtocolStatsAction,
  ],
  triggers: [],
});
