import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getWalletPortfolio } from './lib/actions/get-wallet-portfolio';
import { getTokenBalances } from './lib/actions/get-token-balances';
import { getChainBalance } from './lib/actions/get-chain-balance';
import { getProtocolList } from './lib/actions/get-protocol-list';
import { getNftList } from './lib/actions/get-nft-list';

export const debankAuth = PieceAuth.SecretText({
  displayName: 'Access Key',
  description:
    'Your DeBank Cloud API key. Get one at https://cloud.debank.com/',
  required: true,
});

export const debank = createPiece({
  displayName: 'DeBank',
  auth: debankAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/debank.png',
  authors: ['Bossco'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getWalletPortfolio,
    getTokenBalances,
    getChainBalance,
    getProtocolList,
    getNftList,
  ],
  triggers: [],
});
