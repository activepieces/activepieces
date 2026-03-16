import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getAllProtocols } from './lib/actions/get-all-protocols';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getChainsTvl } from './lib/actions/get-chains-tvl';
import { getTokenPrices } from './lib/actions/get-token-prices';
import { getYieldPools } from './lib/actions/get-yield-pools';

export const defillama = createPiece({
  displayName: 'DefiLlama',
  description:
    'Access DeFi protocol data including TVL, token prices, chain analytics, and yield farming opportunities via the DefiLlama API.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/defillama.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getAllProtocols,
    getProtocolTvl,
    getChainsTvl,
    getTokenPrices,
    getYieldPools,
  ],
  triggers: [],
});
