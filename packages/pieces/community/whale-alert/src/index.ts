import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTransactions } from './lib/actions/get-transactions';
import { getTransaction } from './lib/actions/get-transaction';
import { getStatus } from './lib/actions/get-status';
import { getBlockchains } from './lib/actions/get-blockchains';
import { searchTransactions } from './lib/actions/search-transactions';

export const whaleAlertAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Whale Alert API key. Get one at [developer.whale-alert.io](https://developer.whale-alert.io/api-account/signup).',
  required: true,
});

export const whaleAlert = createPiece({
  displayName: 'Whale Alert',
  description:
    'Track large cryptocurrency transactions in real time across multiple blockchains using the Whale Alert API.',
  logoUrl: 'https://cdn.activepieces.com/pieces/whale-alert.png',
  minimumSupportedRelease: '0.36.1',
  authors: ['bossco7598'],
  auth: whaleAlertAuth,
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getTransactions,
    getTransaction,
    getStatus,
    getBlockchains,
    searchTransactions,
  ],
  triggers: [],
});
