import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getPtpPrice } from './lib/actions/get-ptp-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const platypusFinance = createPiece({
  displayName: 'Platypus Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/platypus-finance.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getPtpPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
