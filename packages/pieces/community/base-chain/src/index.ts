import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getEthPrice } from './lib/actions/get-eth-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const baseChain = createPiece({
  displayName: 'Base Chain',
  description:
    "Access on-chain data for Base — Coinbase's Ethereum Layer-2 built on the OP Stack. Fetch TVL, ETH price, chain breakdown, historical TVL, and key protocol statistics.",
  logoUrl: 'https://cdn.activepieces.com/pieces/base-chain.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getEthPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
