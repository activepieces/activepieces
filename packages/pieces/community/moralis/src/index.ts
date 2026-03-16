import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getWalletBalance } from './lib/actions/get-wallet-balance';
import { getWalletNfts } from './lib/actions/get-wallet-nfts';
import { getWalletTransactions } from './lib/actions/get-wallet-transactions';
import { getTokenPrice } from './lib/actions/get-token-price';
import { getNftMetadata } from './lib/actions/get-nft-metadata';

export const moralisAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API key from https://admin.moralis.io/ after creating a free account.',
  required: true,
});

export const moralis = createPiece({
  displayName: 'Moralis',
  description:
    'Access multi-chain Web3 data including wallet balances, NFTs, transactions, and token prices via the Moralis API.',
  auth: moralisAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moralis.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getWalletBalance,
    getWalletNfts,
    getWalletTransactions,
    getTokenPrice,
    getNftMetadata,
  ],
  triggers: [],
});
