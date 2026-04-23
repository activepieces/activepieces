import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteBudget = createAction({
  auth: ninjapipeAuth,
  name: 'delete_budget',
  displayName: 'Delete Budget',
  description: 'Deletes a budget by ID.',
  props: {
    budgetId: Property.ShortText({ displayName: 'Budget ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/budgets/${context.propsValue.budgetId}` });
    return { success: true, deleted_id: context.propsValue.budgetId };
  },
});
