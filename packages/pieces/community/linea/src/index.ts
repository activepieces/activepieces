import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEthPrice } from './lib/actions/get-eth-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const linea = createPiece({
  displayName: 'Linea',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/linea.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  description:
    'Linea is a ZK rollup Layer-2 on Ethereum by Consensys/MetaMask, using zkEVM for full EVM compatibility. Fetch TVL, ETH price, and chain analytics via free public APIs — no API key required.',
  actions: [
    getProtocolTvl,
    getEthPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
