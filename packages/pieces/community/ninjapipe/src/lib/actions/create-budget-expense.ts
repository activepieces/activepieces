import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createBudgetExpense = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget_expense',
  classification: 'WRITE',
  displayName: 'Create Budget Expense',
  description: 'Records an expense against a budget.',
  audience: 'both',
  aiMetadata: {
    description: 'Record one expense (description, amount, optional category and date) against a NinjaPipe budget by budget ID; the budget spent and remaining amounts update. Not idempotent: each call adds another expense.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.budgetExpense,
  props: {
    budgetId: ninjapipeProps.budgetRequired(),
    description: Property.ShortText({ displayName: 'Description', required: true }),
    amount: Property.Number({ displayName: 'Amount', required: true }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    date: Property.DateTime({ displayName: 'Date', description: 'Date (YYYY-MM-DD). Defaults to today.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const amount = ninjapipeFields.toNumber({ value: p.amount, field: 'Amount' });
    if (amount === undefined) throw new Error('Amount is required.');
    const result = await ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/budgets/${ninjapipeClient.pathId({ value: p.budgetId, field: 'Budget' })}/expenses`,
      body: ninjapipeFields.compact({
        description: p.description,
        amount,
        category: p.category,
        date: ninjapipeFields.toDateOnly({ value: p.date, field: 'Date' }),
      }),
      operation: 'create budget expense',
    });
    return result;
  },
});
