import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEthPrice } from './lib/actions/get-eth-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const zksync = createPiece({
  displayName: 'zkSync Era',
  auth: PieceAuth.None(),
  description:
    'zkSync Era is a ZK rollup Layer-2 on Ethereum by Matter Labs, using zero-knowledge proofs for scalability. Monitor TVL, ETH price, and protocol stats via DeFiLlama and CoinGecko.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zksync.png',
  authors: ['bossco7598'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getProtocolTvl,
    getEthPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
