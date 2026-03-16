import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { zerionAuth } from './lib/auth';
import { getWalletPortfolioAction } from './lib/actions/get-wallet-portfolio';
import { getWalletPositionsAction } from './lib/actions/get-wallet-positions';
import { getWalletTransactionsAction } from './lib/actions/get-wallet-transactions';
import { getWalletNftsAction } from './lib/actions/get-wallet-nfts';
import { getFungibleInfoAction } from './lib/actions/get-fungible-info';

export const zerion = createPiece({
  displayName: 'Zerion',
  description: 'DeFi portfolio tracking and wallet intelligence. Get portfolio values, token positions, NFTs, transactions, and token market data via the Zerion API.',
  auth: zerionAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zerion.png',
  categories: [PieceCategory.FINANCE, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getWalletPortfolioAction,
    getWalletPositionsAction,
    getWalletTransactionsAction,
    getWalletNftsAction,
    getFungibleInfoAction,
  ],
  triggers: [],
});
