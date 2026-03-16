import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTokenBalances } from './lib/actions/get-token-balances';
import { getNftsForOwner } from './lib/actions/get-nfts-for-owner';
import { getAssetTransfers } from './lib/actions/get-asset-transfers';
import { getTokenMetadata } from './lib/actions/get-token-metadata';
import { getNftMetadata } from './lib/actions/get-nft-metadata';

export const alchemyAuth = PieceAuth.SecretText({
  displayName: 'Alchemy API Key',
  description:
    'Get your API key from https://dashboard.alchemy.com after creating a free account.',
  required: true,
});

export const alchemy = createPiece({
  displayName: 'Alchemy',
  description:
    'Access EVM blockchain data including token balances, NFT metadata, asset transfers, and token info via Alchemy API.',
  auth: alchemyAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/alchemy.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getTokenBalances,
    getNftsForOwner,
    getAssetTransfers,
    getTokenMetadata,
    getNftMetadata,
  ],
  triggers: [],
});
