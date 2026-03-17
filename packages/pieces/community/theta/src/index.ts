import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getThetaPrice } from './lib/actions/get-theta-price';
import { getTfuelPrice } from './lib/actions/get-tfuel-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';

export const theta = createPiece({
  displayName: 'Theta Network',
  description:
    'Theta Network is a decentralized video streaming blockchain. Track THETA/TFUEL token prices, protocol TVL, chain breakdown, and historical TVL data using free public APIs from DeFiLlama and CoinGecko.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/theta.png',
  authors: ['bossco7598'],
  auth: undefined,
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getThetaPrice,
    getTfuelPrice,
    getChainBreakdown,
    getTvlHistory,
  ],
  triggers: [],
});
