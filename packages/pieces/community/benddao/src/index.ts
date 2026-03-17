import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const benddao = createPiece({
  displayName: 'BendDAO',
  description:
    'BendDAO is a decentralized NFT-backed lending protocol on Ethereum that allows NFT holders to borrow ETH using their NFTs as collateral. BEND is the governance token. Monitor protocol TVL, BEND token price, chain breakdown, historical TVL, and key protocol stats — all via free public APIs.',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/benddao.png',
  authors: ['bossco7598'],
  actions: [
    getProtocolTvl,
    getTokenPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  triggers: [],
});
