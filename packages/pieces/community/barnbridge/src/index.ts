import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getBondPrice } from './actions/get-bond-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const barnbridge = createPiece({
  displayName: 'BarnBridge',
  description: 'Interact with BarnBridge structured yield and tranched risk DeFi products',
  logoUrl: 'https://cdn.activepieces.com/pieces/barnbridge.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  actions: [getProtocolTvl, getBondPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
