import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from './lib/common/auth';
import { getBudget } from './lib/actions/get-budget';
import { importTransaction } from './lib/actions/import-transaction';
import { getCategories } from './lib/actions/get-categories';
import { importTransactions } from './lib/actions/import-transactions';
import { getAccounts } from './lib/actions/get-accounts';
import { findPayees } from './lib/actions/find-payees';
import { findTransactions } from './lib/actions/find-transactions';
import { updateTransaction } from './lib/actions/update-transaction';
import { deleteTransaction } from './lib/actions/delete-transaction';
import { setBudgetAmount } from './lib/actions/set-budget-amount';
import { runBankSync } from './lib/actions/run-bank-sync';
import { getBudgetMonth } from './lib/actions/ai/get-budget-month';
import { addTransaction } from './lib/actions/ai/add-transaction';
import { listAccounts } from './lib/actions/ai/list-accounts';
import { listCategories } from './lib/actions/ai/list-categories';
import { newTransaction } from './lib/triggers/new-transaction';

export { actualBudgetAuth };

export const actualbudget = createPiece({
  displayName: 'Actual Budget',
  description:
    'Open-source personal finance app with envelope budgeting (self-hosted)',
  auth: actualBudgetAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/actualbudget.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['hugh-codes', 'OdaiAhmed99'],
  actions: [
    getBudget,
    importTransaction,
    importTransactions,
    getCategories,
    getAccounts,
    getBudgetMonth,
    addTransaction,
    listAccounts,
    listCategories,
    findPayees,
    findTransactions,
    updateTransaction,
    deleteTransaction,
    setBudgetAmount,
    runBankSync,
  ],
  triggers: [newTransaction],
});
