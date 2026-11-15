import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualBudgetError, withBudget } from '../common/client';
import {
  ImportResult,
  isRecord,
  failIfNothingImported,
  flushWrites,
  requireAccount,
  requireDate,
  requireId,
} from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

const MAX_ROWS = 5000;

export function validateTransactionRows(
  rows: unknown
): Record<string, unknown>[] {
  if (!Array.isArray(rows)) {
    throw new ActualBudgetError(
      'Transactions must be a JSON array of transaction objects.',
      'invalid-input'
    );
  }
  if (rows.length === 0) {
    throw new ActualBudgetError(
      'Transactions is empty: pass at least one transaction.',
      'invalid-input'
    );
  }
  if (rows.length > MAX_ROWS) {
    throw new ActualBudgetError(
      `Transactions has ${rows.length} rows; import at most ${MAX_ROWS} per step.`,
      'invalid-input'
    );
  }
  return rows.map((row, index) => {
    if (!isRecord(row)) {
      throw new ActualBudgetError(
        `Transaction #${index + 1} must be an object.`,
        'invalid-input'
      );
    }
    requireDate({
      value: row['date'],
      field: `Transaction #${index + 1} date`,
    });
    const raw = row['amount'];
    const amount =
      typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
    if (
      amount !== undefined &&
      amount !== null &&
      !Number.isSafeInteger(amount)
    ) {
      throw new ActualBudgetError(
        `Transaction #${
          index + 1
        } amount must be an integer in cents (e.g. -1250 for -12.50), got ${JSON.stringify(
          raw
        )}.`,
        'invalid-input'
      );
    }
    return amount === raw ? row : { ...row, amount };
  });
}

export const importTransactions = createAction({
  auth: actualBudgetAuth,
  name: 'import_transactions',
  classification: 'WRITE',
  displayName: 'Import Transactions',
  description:
    'Imports many transactions into one account. Amounts are integer cents (-1250 = -12.50). Rows whose imported_id was already imported are skipped.',
  audience: 'both',
  aiMetadata: {
    description:
      'Bulk-imports a JSON array of transactions into one account (account ID from List Accounts). Each row: date (YYYY-MM-DD, required), amount (INTEGER cents, negative = expense, e.g. -1250 for -12.50), optional payee_name, category (ID), notes, imported_id, cleared. Actual runs rules and skips rows whose imported_id was imported before, so set imported_id to make retries safe. Fails when no row is imported; partial row errors are returned in errors. Use Add Transaction for a single transaction.',
    idempotent: false,
  },
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'ID of the account to import into (from Get Accounts / List Accounts)',
      required: true,
    }),
    transactions: Property.Json({
      displayName: 'Transactions',
      description:
        'JSON array of transactions. date = YYYY-MM-DD, amount = integer cents as a number or string like "-1250" (negative = expense, -1250 = -12.50). Optional: payee_name, category (ID), notes, imported_id, cleared.',
      required: true,
      defaultValue: [
        {
          payee_name: 'Kroger',
          date: '2026-12-25',
          amount: -1200,
          imported_id: 'kroger-2026-12-25',
        },
      ],
    }),
  },
  outputSchema: actualOutputSchemas.importResult,
  async run({ auth, propsValue }) {
    const accountId = requireId({
      value: propsValue.account_id,
      field: 'Account ID',
    });
    const rows = validateTransactionRows(propsValue.transactions);
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        await requireAccount({ api, id: accountId });
        const result: ImportResult = await api.importTransactions(
          accountId,
          rows
        );
        failIfNothingImported(result);
        await flushWrites(api);
        return result;
      },
    });
  },
});
