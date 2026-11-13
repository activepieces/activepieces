import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import { flushWrites, requireId, requireTransaction } from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

export const deleteTransaction = createAction({
  auth: actualBudgetAuth,
  name: 'delete_transaction',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Transaction',
  description:
    'Deletes a transaction (and its splits). This cannot be undone from the flow.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one transaction by ID (from Find Transactions), including its splits. Fails when no transaction has that ID, so a repeated call after success fails instead of silently passing. Not reversible.',
    idempotent: false,
  },
  props: {
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      required: true,
    }),
  },
  outputSchema: actualOutputSchemas.deleteTransaction,
  async run({ auth, propsValue }) {
    const id = requireId({
      value: propsValue.transaction_id,
      field: 'Transaction ID',
    });
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        await requireTransaction({ api, id });
        await api.deleteTransaction(id);
        await flushWrites(api);
        return { id, deleted: true };
      },
    });
  },
});
