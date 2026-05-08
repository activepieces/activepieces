import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getBudget = createAction({
  auth: ninjapipeAuth,
  name: 'get_budget',
  displayName: 'Get Budget',
  description: 'Retrieves a budget by ID.',
  props: {
    budgetId: ninjapipeCommon.budgetDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/budgets/${encodeURIComponent(String(context.propsValue.budgetId))}` });
    return flattenCustomFields(response.body);
  },
});
