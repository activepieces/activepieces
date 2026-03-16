import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getBeetsPrice } from './lib/actions/get-beets-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const beethovenX = createPiece({
  displayName: 'Beethoven X',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/beethoven-x.png',
  categories: ['BUSINESS_INTELLIGENCE'],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getBeetsPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
