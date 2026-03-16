import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getEthBalance } from './lib/actions/get-eth-balance';
import { getTransactions } from './lib/actions/get-transactions';
import { getTokenTransfers } from './lib/actions/get-token-transfers';
import { getGasPrice } from './lib/actions/get-gas-price';
import { getBlockInfo } from './lib/actions/get-block-info';

export const etherscanAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your free API key from https://etherscan.io/myapikey after creating an account.',
  required: true,
});

export const etherscan = createPiece({
  displayName: 'Etherscan',
  description:
    'Access Ethereum blockchain data including balances, transactions, token transfers, gas prices, and block information.',
  auth: etherscanAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/etherscan.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getEthBalance,
    getTransactions,
    getTokenTransfers,
    getGasPrice,
    getBlockInfo,
  ],
  triggers: [],
});
