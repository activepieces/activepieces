import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexBudget } from '../common';

export const listBudgets = createAction({
  auth: brexAuth,
  name: 'list_budgets',
  displayName: 'List Budgets',
  description: 'List the budgets in your Brex account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of budgets to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<{ items: BrexBudget[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/budgets',
      queryParams: {
        limit: String(context.propsValue.limit ?? 50),
      },
    });
    return response.body.items.map(brexCommon.flattenBudget);
  },
});
