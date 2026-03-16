import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getLyraPrice } from './lib/actions/get-lyra-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getOptionsStats } from './lib/actions/get-options-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const lyraFinance = createPiece({
  displayName: 'Lyra Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/lyra-finance/src/assets/lyra.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getLyraPrice, getChainBreakdown, getOptionsStats, getTvlHistory],
  triggers: [],
});
