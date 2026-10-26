import { createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import { actualOutputSchemas } from '../common/output-schemas';

export const getCategories = createAction({
  auth: actualBudgetAuth,
  name: 'get_categories',
  classification: 'READ',
  displayName: 'Get Categories',
  description: 'Gets every budget category as a flat list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Builder version of List Categories: returns the raw flat array of all categories (id, name, group_id, is_income, hidden). Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: actualOutputSchemas.categoriesArray,
  async run(context) {
    return withBudget({
      auth: context.auth.props,
      fn: (api) => api.getCategories(),
    });
  },
});
