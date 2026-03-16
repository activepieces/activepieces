import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getWooPrice } from './lib/actions/get-woo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const woofi = createPiece({
  displayName: 'WOOFi',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/woofi.png',
  categories: ['BUSINESS_INTELLIGENCE'],
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getWooPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
