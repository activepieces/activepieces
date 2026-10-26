import { createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../../common/auth';
import { withBudget } from '../../common/client';
import { actualOutputSchemas } from '../../common/output-schemas';

export const listCategories = createAction({
  auth: actualBudgetAuth,
  name: 'list_categories',
  classification: 'READ',
  displayName: 'List Categories',
  description: 'Lists category groups with their categories.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every category group (id, name, is_income, hidden) with its categories (id, name, hidden). Use it to find the category ID for Add Transaction, Update Transaction, Find Transactions or Set Budget Amount. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: actualOutputSchemas.listCategories,
  async run(context) {
    return withBudget({
      auth: context.auth.props,
      fn: async (api) => {
        const groups = await api.getCategoryGroups();
        return {
          groups: groups.map((g) => ({
            id: g.id,
            name: g.name,
            is_income: Boolean(g.is_income),
            hidden: Boolean(g.hidden),
            categories: (g.categories ?? []).map(
              (c: { id: string; name: string; hidden?: boolean }) => ({
                id: c.id,
                name: c.name,
                hidden: Boolean(c.hidden),
              })
            ),
          })),
        };
      },
    });
  },
});
