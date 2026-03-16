import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTokenBalances } from './lib/actions/get-token-balances';
import { getTokenTransfers } from './lib/actions/get-token-transfers';
import { getTokenHolders } from './lib/actions/get-token-holders';
import { getDexSwaps } from './lib/actions/get-dex-swaps';
import { getTokenMetadata } from './lib/actions/get-token-metadata';

export const graphAuth = PieceAuth.SecretText({
  displayName: 'The Graph API Token',
  description:
    'Get your API token from https://thegraph.market/dashboard after creating a free account.',
  required: true,
});

export const theGraph = createPiece({
  displayName: 'The Graph',
  description:
    'Access on-chain DeFi data via The Graph Token API — query ERC-20 token balances, transfers, holders, DEX swaps, and token metadata across major EVM networks.',
  auth: graphAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/the-graph.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getTokenBalances,
    getTokenTransfers,
    getTokenHolders,
    getDexSwaps,
    getTokenMetadata,
  ],
  triggers: [],
});
