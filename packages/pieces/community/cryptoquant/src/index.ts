import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getExchangeInflow } from './lib/actions/get-exchange-inflow';
import { getExchangeOutflow } from './lib/actions/get-exchange-outflow';
import { getMinerFlows } from './lib/actions/get-miner-flows';
import { getFundFlowRatio } from './lib/actions/get-fund-flow-ratio';
import { getStablecoinSupply } from './lib/actions/get-stablecoin-supply';

export const cryptoquantAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your CryptoQuant API key. Get one at https://cryptoquant.com/',
  required: true,
});

export const cryptoquant = createPiece({
  displayName: 'CryptoQuant',
  auth: cryptoquantAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cryptoquant.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getExchangeInflow,
    getExchangeOutflow,
    getMinerFlows,
    getFundFlowRatio,
    getStablecoinSupply,
  ],
  triggers: [],
});
