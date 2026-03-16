import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getPicklePrice } from './actions/get-pickle-price';
import { getYieldStats } from './actions/get-yield-stats';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';

export const pickleFinance = createPiece({
  displayName: 'Pickle Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cryptologos.cc/logos/pickle-finance-pickle-logo.png',
  authors: ['bossco7598'],
  actions: [getProtocolTvl, getPicklePrice, getYieldStats, getChainBreakdown, getTvlHistory],
  triggers: [],
});
