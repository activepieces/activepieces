import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getCurrentUser } from './lib/actions/get-current-user';
import { listUsers } from './lib/actions/list-users';
import { getUser } from './lib/actions/get-user';
import { inviteUser } from './lib/actions/invite-user';
import { listCards } from './lib/actions/list-cards';
import { getCard } from './lib/actions/get-card';
import { lockCard } from './lib/actions/lock-card';
import { unlockCard } from './lib/actions/unlock-card';
import { terminateCard } from './lib/actions/terminate-card';
import { listExpenses } from './lib/actions/list-expenses';
import { getExpense } from './lib/actions/get-expense';
import { updateCardExpense } from './lib/actions/update-card-expense';
import { listCardTransactions } from './lib/actions/list-card-transactions';
import { listCashAccounts } from './lib/actions/list-cash-accounts';
import { getPrimaryCashAccount } from './lib/actions/get-primary-cash-account';
import { listVendors } from './lib/actions/list-vendors';
import { createVendor } from './lib/actions/create-vendor';
import { listTransfers } from './lib/actions/list-transfers';
import { createTransfer } from './lib/actions/create-transfer';
import { listBudgets } from './lib/actions/list-budgets';
import { newExpense } from './lib/triggers/new-expense';
import { newCardTransaction } from './lib/triggers/new-card-transaction';
import {
  expensePaymentUpdated,
  transferProcessed,
  transferFailed,
  userUpdated,
} from './lib/triggers/webhooks';

export const brexAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your Brex API token:

1. Sign in to [dashboard.brex.com](https://dashboard.brex.com) as an **account admin** or **card admin**.
2. Go to **Settings → Developer** and click **Create Token**.
3. Give the token a name and select the **scopes** your flow needs (e.g. *Users*, *Expenses*, *Transactions*, *Payments*).
4. Click create, then copy the token (it starts with \`bxt_\`) and paste it below.

Note: tokens expire if unused for 30 days.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://platform.brexapis.com/v2/users/me',
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API token. Make sure it has not expired and has the required scopes.',
      };
    }
  },
});

export const brex = createPiece({
  displayName: 'Brex',
  description:
    'Manage spend on Brex: users, cards, expenses, transactions, cash accounts, vendors, transfers and budgets.',
  auth: brexAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/brex.png',
  categories: [PieceCategory.ACCOUNTING, PieceCategory.PAYMENT_PROCESSING],
  authors: ['sanket-a11y'],
  actions: [
    getCurrentUser,
    listUsers,
    getUser,
    inviteUser,
    listCards,
    getCard,
    lockCard,
    unlockCard,
    terminateCard,
    listExpenses,
    getExpense,
    updateCardExpense,
    listCardTransactions,
    listCashAccounts,
    getPrimaryCashAccount,
    listVendors,
    createVendor,
    listTransfers,
    createTransfer,
    listBudgets,
    createCustomApiCallAction({
      baseUrl: () => 'https://platform.brexapis.com',
      auth: brexAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [
    newExpense,
    newCardTransaction,
    expensePaymentUpdated,
    transferProcessed,
    transferFailed,
    userUpdated,
  ],
});
