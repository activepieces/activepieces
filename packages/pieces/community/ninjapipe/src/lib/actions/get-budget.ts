import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getBudget = createAction({
  auth: ninjapipeAuth,
  name: 'get_budget',
  displayName: 'Get Budget',
  description: 'Retrieves a budget by ID.',
  props: {
    budgetId: Property.ShortText({ displayName: 'Budget ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/budgets/${context.propsValue.budgetId}` });
    return flattenCustomFields(response.body);
  },
});
