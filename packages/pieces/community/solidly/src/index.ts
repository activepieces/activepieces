import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getSolidPrice } from './lib/actions/get-solid-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const solidly = createPiece({
  displayName: 'Solidly',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/solidly.png',
  categories: ['BUSINESS_INTELLIGENCE'],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getSolidPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
