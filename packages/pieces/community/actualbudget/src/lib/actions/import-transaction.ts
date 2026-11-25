import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import {
  ImportResult,
  dateFromDateTime,
  flushWrites,
  failIfNothingImported,
  optionalCents,
  optionalId,
  requireAccount,
  requireId,
} from '../common/helpers';
import { Transaction } from '../common/models';
import { actualOutputSchemas } from '../common/output-schemas';
import { accountDropdown, categoryDropdown } from '../common/props';

export const importTransaction = createAction({
  auth: actualBudgetAuth,
  name: 'import_transaction',
  classification: 'WRITE',
  displayName: 'Import Transaction',
  description:
    'Adds one transaction to an account. Actual runs your rules on it and skips it when the Imported ID was already imported.',
  audience: 'human',
  aiMetadata: {
    description:
      'Builder version of Add Transaction with account and category dropdowns. Adds one transaction; skipped as a duplicate when the Imported ID was imported before. Not idempotent without an Imported ID.',
    idempotent: false,
  },
  props: {
    account_id: accountDropdown({
      required: true,
      description: 'The account to add the transaction to',
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description:
        'The day the transaction took place. A plain date (YYYY-MM-DD) is kept as is; a date with a time is stored on its UTC day.',
      required: true,
    }),
    payee_name: Property.ShortText({
      displayName: 'Payee Name',
      description:
        'Name of the payee. Actual reuses a payee with this name or creates it.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'Amount in your currency, e.g. -12.50. Negative = money out (expense), positive = money in.',
      required: false,
    }),
    category: categoryDropdown({
      required: false,
      description: 'Category of the transaction',
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the transaction',
      required: false,
    }),
    imported_id: Property.ShortText({
      displayName: 'Imported ID',
      description:
        'Unique ID from your bank or source system. A second import with the same ID is skipped.',
      required: false,
    }),
    transfer_id: Property.ShortText({
      displayName: 'Transfer ID',
      description:
        "Legacy field, ignored by Actual on import. To record a transfer, use the other account's transfer payee as the Payee Name.",
      required: false,
    }),
    cleared: Property.Checkbox({
      displayName: 'Cleared',
      description: 'Whether the transaction has cleared',
      required: false,
    }),
    imported_payee: Property.ShortText({
      displayName: 'Imported Payee',
      description: 'Raw description from the bank, kept as the original value',
      required: false,
    }),
  },
  outputSchema: actualOutputSchemas.importResult,
  async run({ auth, propsValue }) {
    const accountId = requireId({
      value: propsValue.account_id,
      field: 'Account',
    });
    const transaction: Transaction = {
      account: accountId,
      date: dateFromDateTime({ value: propsValue.date, field: 'Date' }),
      amount: optionalCents({ value: propsValue.amount, field: 'Amount' }),
      payee_name: propsValue.payee_name || undefined,
      category: optionalId(propsValue.category),
      notes: propsValue.notes || undefined,
      imported_id: propsValue.imported_id || undefined,
      transfer_id: propsValue.transfer_id || undefined,
      cleared: propsValue.cleared,
      imported_payee: propsValue.imported_payee || undefined,
    };
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        await requireAccount({ api, id: accountId });
        const result: ImportResult = await api.importTransactions(accountId, [
          transaction,
        ]);
        failIfNothingImported(result);
        await flushWrites(api);
        return result;
      },
    });
  },
});
