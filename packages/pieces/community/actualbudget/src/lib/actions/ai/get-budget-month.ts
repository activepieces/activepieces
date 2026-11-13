import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../../common/auth';
import { withBudget } from '../../common/client';
import { requireMonth } from '../../common/helpers';
import { actualOutputSchemas } from '../../common/output-schemas';

export const getBudgetMonth = createAction({
  auth: actualBudgetAuth,
  name: 'get_budget_month',
  classification: 'READ',
  displayName: 'Get Budget Month',
  description: 'Gets the budget for one month (YYYY-MM).',
  audience: 'ai',
  aiMetadata: {
    description:
      "Gets the envelope budget for one month: totals (toBudget, totalBudgeted, totalSpent, totalIncome, incomeAvailable) and every category group with each category's budgeted, spent and balance. All amounts are INTEGER cents (12030 = 120.30); spent is negative. Fails when the budget has no data for that month. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    month: Property.ShortText({
      displayName: 'Month',
      description: 'Month in YYYY-MM format, e.g. 2026-10',
      required: true,
    }),
  },
  outputSchema: actualOutputSchemas.budgetMonth,
  async run(context) {
    const month = requireMonth({
      value: context.propsValue.month,
      field: 'Month',
    });
    return withBudget({
      auth: context.auth.props,
      fn: (api) => api.getBudgetMonth(month),
    });
  },
});
