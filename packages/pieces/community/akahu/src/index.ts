import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getAllAccounts } from './lib/actions/get-all-accounts';
import { getTransactions } from './lib/actions/get-transactions';
import { getTransactionsByAccount } from './lib/actions/get-transactions-by-account';
import { getTransactionById } from './lib/actions/get-transaction-by-id';
import { getAccountById } from './lib/actions/get-account-by-id';

export const akahuAuth = PieceAuth.CustomAuth({
  description: `Enter your Akahu API credentials. You can find these in your Akahu developer dashboard.
  Refer to the Akahu authentication documentation for more details`,
  props: {
    app_token: PieceAuth.SecretText({
      displayName: 'App ID Token',
      description: 'Your Akahu App ID Token.',
      required: true,
    }),
    user_token: PieceAuth.SecretText({
      displayName: 'User Token',
      description: 'An Akahu User Access Token.',
      required: true,
    }),
  },
  required: true,
});

export const akahu = createPiece({
  displayName: 'Akahu',
  auth: akahuAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/akahu.png',
  authors: ['hugh-codes'],
  actions: [
    getAllAccounts,
    getAccountById,
    getTransactions,
    getTransactionsByAccount,
    getTransactionById,
  ],
  triggers: [],
});
