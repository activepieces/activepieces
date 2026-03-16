import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getGnsPrice } from './actions/get-gns-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const gainsNetwork = createPiece({
  displayName: 'Gains Network',
  description: 'Interact with Gains Network (gTrade) decentralized leveraged trading for crypto, forex, and stocks',
  logoUrl: 'https://cdn.activepieces.com/pieces/gains-network.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  authors: [],
  actions: [getProtocolTvl, getGnsPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
