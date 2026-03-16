import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getVrtxPrice } from './actions/get-vrtx-price';
import { getChainBreakdown } from './actions/get-chain-breakdown';
import { getTvlHistory } from './actions/get-tvl-history';
import { getProtocolStats } from './actions/get-protocol-stats';

export const vertexProtocol = createPiece({
  displayName: 'Vertex Protocol',
  description:
    'Interact with Vertex Protocol cross-margined DEX for spot, perpetuals, and money markets on Arbitrum',
  logoUrl: 'https://cdn.activepieces.com/pieces/vertex-protocol.png',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.FINANCE_AND_ACCOUNTING],
  actions: [getProtocolTvl, getVrtxPrice, getChainBreakdown, getTvlHistory, getProtocolStats],
  triggers: [],
});
