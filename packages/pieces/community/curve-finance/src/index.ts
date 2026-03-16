import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getPools } from './lib/actions/get-pools';
import { getPoolStats } from './lib/actions/get-pool-stats';
import { getProtocolStats } from './lib/actions/get-protocol-stats';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getGaugeData } from './lib/actions/get-gauge-data';

export const curveFinance = createPiece({
  displayName: 'Curve Finance',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/curve-finance.png',
  authors: ['bossco7598'],
  actions: [getPools, getPoolStats, getProtocolStats, getTokenPrice, getGaugeData],
  triggers: [],
});
