import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../../common/auth';
import { withBudget } from '../../common/client';
import {
  ImportResult,
  failIfNothingImported,
  flushWrites,
  optionalId,
  queryRows,
  requireAccount,
  requireCategory,
  requireDate,
  requireId,
  toCents,
} from '../../common/helpers';
import { Transaction } from '../../common/models';
import { actualOutputSchemas } from '../../common/output-schemas';

export const addTransaction = createAction({
  auth: actualBudgetAuth,
  name: 'add_transaction',
  classification: 'WRITE',
  displayName: 'Add Transaction',
  description: 'Adds one transaction to an account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Adds one transaction to an account. amount is in currency units (decimal): negative = expense (-12.50), positive = income. date is YYYY-MM-DD. payee_name reuses or creates a payee; category_id comes from List Categories, account_id from List Accounts. Actual runs the user's rules. Not idempotent: each call adds a new transaction, unless imported_id is set, in which case a repeat call with the same imported_id is skipped and returns the existing transaction_id with duplicate=true. Set imported_id when a retry must not create a second transaction.",
    idempotent: false,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'Account ID from List Accounts',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'YYYY-MM-DD',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'Decimal amount in currency units; negative = expense, e.g. -12.50',
      required: true,
    }),
    payee_name: Property.ShortText({
      displayName: 'Payee Name',
      description: 'Who was paid or who paid',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Category ID from List Categories',
      required: false,
    }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    imported_id: Property.ShortText({
      displayName: 'Imported ID',
      description:
        'Optional unique key; a repeat with the same key is skipped instead of added twice',
      required: false,
    }),
    cleared: Property.Checkbox({
      displayName: 'Cleared',
      description: 'Mark as cleared',
      required: false,
    }),
  },
  outputSchema: actualOutputSchemas.addTransactionResult,
  async run({ auth, propsValue }) {
    const accountId = requireId({
      value: propsValue.account_id,
      field: 'Account ID',
    });
    const categoryId = optionalId(propsValue.category_id);
    const importedId = optionalId(propsValue.imported_id);
    const transaction: Transaction = {
      account: accountId,
      date: requireDate({ value: propsValue.date, field: 'Date' }),
      amount: toCents({ value: propsValue.amount, field: 'Amount' }),
      payee_name: optionalId(propsValue.payee_name),
      category: categoryId,
      notes: propsValue.notes || undefined,
      imported_id: importedId,
      cleared: propsValue.cleared,
    };
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        await requireAccount({ api, id: accountId });
        if (categoryId) {
          await requireCategory({ api, id: categoryId });
        }
        const result: ImportResult = await api.importTransactions(accountId, [
          transaction,
        ]);
        failIfNothingImported(result);
        await flushWrites(api);
        const added = result.added ?? [];
        const updated = result.updated ?? [];
        let transactionId: string | null = added[0] ?? updated[0] ?? null;
        let duplicate = false;
        if (!transactionId && importedId) {
          const existing = await queryRows({
            api,
            query: api
              .q('transactions')
              .filter({ account: accountId, imported_id: importedId })
              .select(['id']),
          });
          const existingId = existing[0]?.['id'];
          transactionId = typeof existingId === 'string' ? existingId : null;
          duplicate = transactionId !== null;
        }
        return {
          transaction_id: transactionId,
          created: added.length > 0,
          duplicate,
          added,
          updated,
          errors: result.errors ?? [],
        };
      },
    });
  },
});
