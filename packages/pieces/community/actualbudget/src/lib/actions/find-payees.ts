import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import { actualOutputSchemas } from '../common/output-schemas';

export const findPayees = createAction({
  auth: actualBudgetAuth,
  name: 'find_payees',
  classification: 'SEARCH',
  displayName: 'Find Payees',
  description:
    'Finds payees whose name contains the search text (all payees when empty).',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds payees by case-insensitive name substring; empty search returns all payees. Each payee has id, name, category (default category ID or null) and transfer_acct (set when the payee is a transfer to that account). Use it to get a payee ID for Find Transactions or Update Transaction. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Name Contains',
      description:
        'Part of the payee name, e.g. "kroger". Leave empty to list all payees.',
      required: false,
    }),
  },
  outputSchema: actualOutputSchemas.findPayees,
  async run(context) {
    const needle = (context.propsValue.search ?? '').trim().toLowerCase();
    return withBudget({
      auth: context.auth.props,
      fn: async (api) => {
        const payees = (await api.getPayees())
          .filter(
            (p) =>
              needle === '' || (p.name ?? '').toLowerCase().includes(needle)
          )
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category ?? null,
            transfer_acct: p.transfer_acct ?? null,
          }));
        return { payees, count: payees.length };
      },
    });
  },
});
