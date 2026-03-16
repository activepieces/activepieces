import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getElkPrice } from './lib/actions/get-elk-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const elkFinance = createPiece({
  displayName: 'Elk Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/elk-finance.png',
  categories: ['BUSINESS_INTELLIGENCE'],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getElkPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
