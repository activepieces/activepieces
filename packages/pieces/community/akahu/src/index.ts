import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getAllAccounts } from './lib/actions/get-all-accounts';
import { getTransactions } from './lib/actions/get-transactions';
import { getTransactionsByAccount } from './lib/actions/get-transactions-by-account';

export const akahuAuth = PieceAuth.CustomAuth({
  description: 'Enter authentication details',
  props: {
    app_token: PieceAuth.SecretText({
      displayName: 'App Token',
      description: 'Your App ID Token.',
      required: true,
    }),
    user_token: PieceAuth.SecretText({
      displayName: 'User Token',
      description: 'Your User Token.',
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
  actions: [getAllAccounts, getTransactions, getTransactionsByAccount],
  triggers: [],
});
