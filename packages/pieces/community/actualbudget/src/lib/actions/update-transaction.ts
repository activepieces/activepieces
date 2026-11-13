import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualBudgetError, withBudget } from '../common/client';
import {
  flushWrites,
  loadLookups,
  mapTransaction,
  optionalCents,
  optionalDate,
  optionalId,
  requireCategory,
  requireId,
  requirePayee,
  requireTransaction,
} from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

export const updateTransaction = createAction({
  auth: actualBudgetAuth,
  name: 'update_transaction',
  classification: 'WRITE',
  displayName: 'Update Transaction',
  description:
    'Changes fields of an existing transaction. Empty fields are left unchanged.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one transaction by ID (from Find Transactions). Only the fields you pass change: date (YYYY-MM-DD), amount (decimal, negative = expense), payee_id (from Find Payees), category_id (from List Categories), notes, cleared ("true"/"false"). Set clear_notes=true to blank the notes. Fails when the transaction does not exist or nothing to change was given. Returns the updated transaction. Idempotent: repeating it with the same values changes nothing further.',
    idempotent: true,
  },
  props: {
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'New date, YYYY-MM-DD',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'New amount, e.g. -12.50 (negative = expense)',
      required: false,
    }),
    payee_id: Property.ShortText({
      displayName: 'Payee ID',
      description: 'New payee ID (from Find Payees)',
      required: false,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'New category ID',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'New notes',
      required: false,
    }),
    clear_notes: Property.Checkbox({
      displayName: 'Clear Notes',
      description: 'Remove the notes',
      required: false,
    }),
    cleared: Property.StaticDropdown({
      displayName: 'Cleared',
      description: 'Leave empty to keep the current value',
      required: false,
      options: {
        options: [
          { label: 'Cleared', value: 'true' },
          { label: 'Not cleared', value: 'false' },
        ],
      },
    }),
  },
  outputSchema: actualOutputSchemas.updateTransaction,
  async run({ auth, propsValue }) {
    const id = requireId({
      value: propsValue.transaction_id,
      field: 'Transaction ID',
    });
    const fields: Record<string, unknown> = {};
    const date = optionalDate({ value: propsValue.date, field: 'Date' });
    if (date !== undefined) fields['date'] = date;
    const amount = optionalCents({ value: propsValue.amount, field: 'Amount' });
    if (amount !== undefined) fields['amount'] = amount;
    const payeeId = optionalId(propsValue.payee_id);
    if (payeeId) fields['payee'] = payeeId;
    const categoryId = optionalId(propsValue.category_id);
    if (categoryId) fields['category'] = categoryId;
    if (propsValue.clear_notes === true) {
      if (propsValue.notes) {
        throw new ActualBudgetError(
          'Set either Notes or Clear Notes, not both.',
          'invalid-input'
        );
      }
      fields['notes'] = null;
    } else if (
      typeof propsValue.notes === 'string' &&
      propsValue.notes !== ''
    ) {
      fields['notes'] = propsValue.notes;
    }
    const cleared: unknown = propsValue.cleared;
    if (cleared === 'true' || cleared === true) fields['cleared'] = true;
    else if (cleared === 'false' || cleared === false)
      fields['cleared'] = false;
    else if (cleared !== undefined && cleared !== null && cleared !== '') {
      throw new ActualBudgetError(
        'Cleared must be "true" or "false".',
        'invalid-input'
      );
    }
    if (Object.keys(fields).length === 0) {
      throw new ActualBudgetError(
        'Nothing to update: set at least one field.',
        'invalid-input'
      );
    }

    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        await requireTransaction({ api, id });
        if (payeeId) await requirePayee({ api, id: payeeId });
        if (categoryId) await requireCategory({ api, id: categoryId });
        await api.updateTransaction(id, fields);
        await flushWrites(api);
        const after = await requireTransaction({ api, id });
        return {
          id,
          updated: true,
          transaction: mapTransaction({
            tx: after,
            lookups: await loadLookups(api),
          }),
        };
      },
    });
  },
});
