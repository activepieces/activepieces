import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getProtocolTvl } from './lib/actions/get-protocol-tvl';
import { getNftxPrice } from './lib/actions/get-nftx-price';
import { getChainBreakdown } from './lib/actions/get-chain-breakdown';
import { getTvlHistory } from './lib/actions/get-tvl-history';
import { getProtocolStats } from './lib/actions/get-protocol-stats';

export const nftx = createPiece({
  displayName: 'NFTX',
  description:
    'NFTX is an NFT liquidity protocol that allows users to create ERC-20 tokens (vault tokens) backed by NFT collections, enabling trading and yield generation on otherwise illiquid NFTs.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/nftx.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: PieceAuth.None(),
  actions: [
    getProtocolTvl,
    getNftxPrice,
    getChainBreakdown,
    getTvlHistory,
    getProtocolStats,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
