import { actualBudgetAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { getMonths, getYears, initializeAndDownloadBudget } from '../common/common';


export const getBudget = createAction({
  auth: actualBudgetAuth,
  name: 'get_budget',
  displayName: 'Get Budget',
  description: 'Get your monthly budget',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the budget for a single month from an Actual Budget server, including each category group and category for that month. Use it to read budgeted, spent, and balance figures for a specific period; the month and year must be supplied as separate inputs. Read-only and idempotent.', idempotent: true },
  props: {
    month: Property.StaticDropdown({
      displayName: 'Month',
      description: 'The month of the budget you want to get',
      required: true,
      options: {
        options: getMonths()
        }
    }),
    year: Property.StaticDropdown({
      displayName: 'Year',
      description: 'The year of the budget you want to get',
      required: true,
      options: {
        options: getYears()
      }
    })
  },
  async run(context) {
    await initializeAndDownloadBudget(api, context.auth.props)
    const budget = await api.getBudgetMonth(`${context.propsValue.year}-${context.propsValue.month}`);
    await api.shutdown();
    return budget;
  },
});
