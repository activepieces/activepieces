import { Property, createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualBudgetError, withBudget } from '../common/client';
import {
  flushWrites,
  fromCents,
  requireCategory,
  requireId,
  requireMonth,
  toCents,
} from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';

export const setBudgetAmount = createAction({
  auth: actualBudgetAuth,
  name: 'set_budget_amount',
  classification: 'WRITE',
  displayName: 'Set Budget Amount',
  description:
    'Sets how much is budgeted for a category in a month (replaces the current amount).',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets (replaces, does not add to) the budgeted amount of one category for one month. month is YYYY-MM and must be a month the budget has; category_id from List Categories; amount in decimal currency units (e.g. 250 or 99.90). Returns the new budgeted amount and the category balance in cents. Idempotent: the same call twice leaves the same value.',
    idempotent: true,
  },
  props: {
    month: Property.ShortText({
      displayName: 'Month',
      description: 'YYYY-MM, e.g. 2026-10',
      required: true,
    }),
    category_id: Property.ShortText({
      displayName: 'Category ID',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Budgeted amount in currency units, e.g. 250',
      required: true,
    }),
  },
  outputSchema: actualOutputSchemas.setBudgetAmount,
  async run({ auth, propsValue }) {
    const month = requireMonth({ value: propsValue.month, field: 'Month' });
    const categoryId = requireId({
      value: propsValue.category_id,
      field: 'Category ID',
    });
    const cents = toCents({ value: propsValue.amount, field: 'Amount' });
    return withBudget({
      auth: auth.props,
      fn: async (api) => {
        const months = await api.getBudgetMonths();
        if (!months.includes(month)) {
          throw new ActualBudgetError(
            `The budget has no month ${month}. Available: ${months[0]} to ${
              months[months.length - 1]
            }.`,
            'invalid-input'
          );
        }
        const category = await requireCategory({ api, id: categoryId });
        await api.setBudgetAmount(month, categoryId, cents);
        await flushWrites(api);
        const after = await api.getBudgetMonth(month);
        const row = after.categoryGroups
          .flatMap((g) => g.categories ?? [])
          .find((c) => c['id'] === categoryId);
        const budgetedValue = row?.['budgeted'];
        const balanceValue = row?.['balance'];
        const budgeted =
          typeof budgetedValue === 'number' ? budgetedValue : cents;
        return {
          month,
          category_id: categoryId,
          category_name: category.name,
          amount: budgeted,
          amount_decimal: fromCents(budgeted),
          balance: typeof balanceValue === 'number' ? balanceValue : null,
        };
      },
    });
  },
});
