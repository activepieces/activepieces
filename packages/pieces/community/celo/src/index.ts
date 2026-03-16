import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getCeloPrice } from './lib/actions/get-celo-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const celo = createPiece({
  displayName: 'Celo',
  description:
    'Celo is an EVM-compatible mobile-first blockchain focused on financial inclusion, featuring a stablecoin ecosystem (cUSD, cEUR, cREAL). CELO is the native governance token.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/celo.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getCeloPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
