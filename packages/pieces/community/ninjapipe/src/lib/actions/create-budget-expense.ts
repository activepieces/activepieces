import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const createBudgetExpense = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget_expense',
  displayName: 'Create Budget Expense',
  description: 'Adds an expense to a budget.',
  props: {
    budgetId: Property.ShortText({ displayName: 'Budget ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    amount: Property.Number({ displayName: 'Amount', required: true }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    date: Property.ShortText({ displayName: 'Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.amount !== undefined) body.amount = p.amount;
    if (p.currency) body.currency = p.currency;
    if (p.date) body.date = p.date;
    if (p.notes) body.notes = p.notes;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: `/budgets/${p.budgetId}/expenses`, body });
    return flattenCustomFields(response.body);
  },
});
