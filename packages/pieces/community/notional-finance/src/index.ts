import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getNotePrice } from './lib/actions/get-note-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getLendingStats } from './lib/actions/get-lending-stats';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const notionalFinance = createPiece({
  displayName: 'Notional Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/notional-finance/src/assets/notional.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getNotePrice, getChainBreakdown, getLendingStats, getTvlHistory],
  triggers: [],
});
