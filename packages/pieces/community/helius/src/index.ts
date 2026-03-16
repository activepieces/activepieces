import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getWalletTokens } from './lib/actions/get-wallet-tokens';
import { getAssetInfo } from './lib/actions/get-asset-info';
import { getAssetsByOwner } from './lib/actions/get-assets-by-owner';
import { getWalletTransactions } from './lib/actions/get-wallet-transactions';
import { searchAssets } from './lib/actions/search-assets';

export const heliusAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API key from https://helius.dev after creating a free account.',
  required: true,
});

export const helius = createPiece({
  displayName: 'Helius',
  description:
    'Access Solana blockchain data including wallet balances, NFT metadata, transaction history, and asset search via Helius DAS API.',
  auth: heliusAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/helius.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getWalletTokens,
    getAssetInfo,
    getAssetsByOwner,
    getWalletTransactions,
    searchAssets,
  ],
  triggers: [],
});
