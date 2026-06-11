import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ynabAuth } from '../auth';
import { ynabCommon, YnabCategory } from '../common';

export const budgetToCategory = createAction({
  auth: ynabAuth,
  name: 'budget_to_category',
  displayName: 'Budget to a Category',
  description: 'Sets the budgeted amount for a category in the current month.',
  props: {
    budgetId: ynabCommon.budgetIdDropdown,
    categoryId: ynabCommon.categoryIdDropdown({
      required: true,
      description: 'The category to assign the budgeted amount to.',
    }),
    amount: Property.Number({
      displayName: 'Budgeted Amount',
      description:
        'The amount to budget in your currency (e.g. 250.00). This replaces the current budgeted amount for the month.',
      required: true,
    }),
  },
  async run(context) {
    const { budgetId, categoryId, amount } = context.propsValue;
    const response = await ynabCommon.apiCall<{
      data: { category: YnabCategory };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/budgets/${budgetId}/months/current/categories/${categoryId}`,
      body: {
        category: {
          budgeted: ynabCommon.toMilliunits({ amount }),
        },
      },
    });
    return response.body.data.category;
  },
});
