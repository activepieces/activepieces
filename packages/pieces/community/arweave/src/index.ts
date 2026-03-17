import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getArPrice } from './lib/actions/get-ar-price';
import { getNetworkInfo } from './lib/actions/get-network-info';
import { getWalletBalance } from './lib/actions/get-wallet-balance';
import { getTransaction } from './lib/actions/get-transaction';
import { getBlockInfo } from './lib/actions/get-block-info';

export const arweave = createPiece({
  displayName: 'Arweave',
  description:
    'Arweave is a permanent, decentralized storage network. Pay once, store forever. Used for NFT metadata, dApps, and censorship-resistant data storage.',
  auth: undefined,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/arweave.png',
  categories: [PieceCategory.CRYPTO],
  authors: ['bossco7598'],
  actions: [
    getArPrice,
    getNetworkInfo,
    getWalletBalance,
    getTransaction,
    getBlockInfo,
  ],
  triggers: [],
});
