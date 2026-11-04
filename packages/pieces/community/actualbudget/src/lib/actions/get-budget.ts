import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import { requireMonth } from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';
import { monthOptions, yearDropdown } from '../common/props';

export const getBudget = createAction({
  auth: actualBudgetAuth,
  name: 'get_budget',
  classification: 'READ',
  displayName: 'Get Budget',
  description:
    'Gets the budget for one month: totals plus budgeted, spent and balance per category (amounts in cents).',
  audience: 'human',
  aiMetadata: {
    description:
      'Builder version of Get Budget Month with month and year dropdowns. Returns the month totals and every category group with budgeted, spent and balance in integer cents. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    month: Property.StaticDropdown({
      displayName: 'Month',
      description: 'The month of the budget you want to get',
      required: true,
      options: { options: monthOptions() },
    }),
    year: yearDropdown,
  },
  outputSchema: actualOutputSchemas.budgetMonth,
  async run(context) {
    const month = requireMonth({
      value: `${context.propsValue.year}-${context.propsValue.month}`,
      field: 'Month',
    });
    return withBudget({
      auth: context.auth.props,
      fn: (api) => api.getBudgetMonth(month),
    });
  },
});
