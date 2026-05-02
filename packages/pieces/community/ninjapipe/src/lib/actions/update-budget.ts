import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const updateBudget = createAction({
  auth: ninjapipeAuth,
  name: 'update_budget',
  displayName: 'Update Budget',
  description: 'Updates a budget by ID.',
  props: {
    budgetId: ninjapipeCommon.budgetDropdownRequired,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    allocated: Property.Number({
      displayName: 'Allocated Amount',
      description: 'Total allocated budget amount. Must be greater than 0 if set.',
      required: false,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    category: ninjapipeCommon.budgetCategoryDropdown,
    period: ninjapipeCommon.budgetPeriodDropdown,
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    status: ninjapipeCommon.budgetStatusDropdown,
    startDate: Property.DateTime({ displayName: 'Start Date', required: false }),
    endDate: Property.DateTime({ displayName: 'End Date', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = {};
    if (p.name) body['name'] = p.name;
    if (p.allocated !== undefined && p.allocated !== null) body['allocated'] = p.allocated;
    if (p.description !== undefined) body['description'] = p.description;
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
      method: HttpMethod.PUT,
      path: `/budgets/${encodeURIComponent(String(p.budgetId))}`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
