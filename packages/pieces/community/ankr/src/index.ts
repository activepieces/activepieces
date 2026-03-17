import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAnkrPrice } from './lib/actions/get-ankr-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const ankr = createPiece({
  displayName: 'Ankr',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://coin-images.coingecko.com/coins/images/4324/small/U85xTl2.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Bossco'],
  actions: [getProtocolTvl, getAnkrPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
