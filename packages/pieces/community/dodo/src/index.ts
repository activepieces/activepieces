import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getDodoPrice } from './lib/actions/get-dodo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const dodo = createPiece({
  displayName: 'DODO Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dodo.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getDodoPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});