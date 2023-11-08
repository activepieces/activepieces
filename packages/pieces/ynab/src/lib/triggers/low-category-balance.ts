import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

import { ynabAuth } from '../../index';
import { ynabCommon } from '../common';
import { YnabCategory } from '../common/models';

export const lowCategoryBalance = createTrigger({
  auth: ynabAuth,
  name: 'low_category_balance',
  displayName: 'Low Category Balance',
  description: 'Triggers when a category balance is below a certain amount.',
  props: {
    budget: ynabCommon.budget,
    category: ynabCommon.category,
    balanceBelowAmount: Property.Number({
      displayName: 'Balance Below Amount',
      required: true,
      description: "Category balance falls below this amount (e.g. '20.50')",
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: () => Promise.resolve(),
  onDisable: () => Promise.resolve(),
  run: async (context): Promise<YnabCategory[]> => {
    const { budget, category, balanceBelowAmount } = context.propsValue;
    const ynabCategory = await ynabCommon.fetchCategory({
      auth: context.auth,
      budget,
      category,
    });

    if (ynabCategory.balance < ynabCommon.toMilliUnits(balanceBelowAmount)) {
      return [ynabCategory];
    } else {
      return [];
    }
  },
  test: async (context) => {
    const { budget, category } = context.propsValue;
    const ynabCategory = await ynabCommon.fetchCategory({
      auth: context.auth,
      budget,
      category,
    });

    return [ynabCategory];
  },
  sampleData: [
    {
      id: '1234',
      name: 'Groceries',
      hidden: false,
      budgeted: 25000,
      activity: 8540,
      balance: 38250,
      deleted: false,
    },
  ],
});
