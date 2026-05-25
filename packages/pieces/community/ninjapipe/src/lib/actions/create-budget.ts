import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const createBudget = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget',
  displayName: 'Create Budget',
  description: 'Creates a new budget.',
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Budget name.', required: true }),
    allocated: Property.Number({
      displayName: 'Allocated Amount',
      description: 'Total allocated budget amount. Must be greater than 0.',
      required: true,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    category: ninjapipeCommon.budgetCategoryDropdown,
    period: ninjapipeCommon.budgetPeriodDropdown,
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code, e.g. USD, EUR. Defaults to USD.',
      required: false,
    }),
    status: ninjapipeCommon.budgetStatusDropdown,
    startDate: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = {
      name: p.name,
      allocated: p.allocated,
    };
    if (p.description) body['description'] = p.description;
    if (p.category) body['category'] = p.category;
    if (p.period) body['period'] = p.period;
    if (p.currency) body['currency'] = p.currency;
    if (p.status) body['status'] = p.status;
    {
      const v = toDateOnly(p.startDate);
      if (v) body['start_date'] = v;
    }
    {
      const v = toDateOnly(p.endDate);
      if (v) body['end_date'] = v;
    }
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/budgets',
      body,
    });
    return flattenCustomFields(response.body);
  },
});
