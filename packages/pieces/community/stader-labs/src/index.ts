import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSdPrice } from './lib/actions/get-sd-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const staderLabs = createPiece({
  displayName: 'Stader Labs',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://coin-images.coingecko.com/coins/images/24513/small/stader.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Bossco'],
  actions: [getProtocolTvl, getSdPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
