import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getAnglePrice } from './lib/actions/get-angle-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getStablecoinStats } from './lib/actions/get-stablecoin-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const angleProtocol = createPiece({
  displayName: 'Angle Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/angle-protocol.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [getProtocolTvl, getAnglePrice, getChainBreakdown, getStablecoinStats, getTvlHistory],
  triggers: [],
});
