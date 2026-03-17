import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSwisePrice } from './lib/actions/get-swise-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const stakewise = createPiece({
  displayName: 'StakeWise',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://coin-images.coingecko.com/coins/images/13605/small/stakewise.jpg',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Bossco'],
  actions: [getProtocolTvl, getSwisePrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
