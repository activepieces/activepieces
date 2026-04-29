import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, toDateOnly, ninjapipeCommon } from '../common';

export const createBudgetExpense = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget_expense',
  displayName: 'Create Budget Expense',
  description: 'Adds an expense to a budget. The expense amount is added to the budget\'s spent amount.',
  props: {
    budgetId: ninjapipeCommon.budgetDropdownRequired,
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description of the expense.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Expense amount (positive number).',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Expense category (e.g. Marketing, Travel).',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'Expense date.',
      required: true,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const date = toDateOnly(p.date);
    if (!date) throw new Error('Date is required.');
    const body: Record<string, unknown> = {
      description: p.description,
      amount: p.amount,
      category: p.category,
      date,
    };
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: `/budgets/${encodeURIComponent(String(p.budgetId))}/expenses`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
