import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './actions/get-protocol-tvl';
import { getHopPrice } from './actions/get-hop-price';
import { getBridgeStats } from './actions/get-bridge-stats';
import { getTransferVolume } from './actions/get-transfer-volume';
import { getChainTvl } from './actions/get-chain-tvl';

export const hopProtocol = createPiece({
  displayName: 'Hop Protocol',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hop-protocol.png',
  authors: ['bossco7598'],
  categories: ['FEATURED', 'FINANCE'],
  actions: [getProtocolTvl, getHopPrice, getBridgeStats, getTransferVolume, getChainTvl],
  triggers: [],
});
