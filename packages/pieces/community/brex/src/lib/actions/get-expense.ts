import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexExpense } from '../common';

export const getExpense = createAction({
  auth: brexAuth,
  name: 'get_expense',
  displayName: 'Get Expense',
  description: 'Get the details of a single expense by its ID.',
  props: {
    expenseId: Property.ShortText({
      displayName: 'Expense ID',
      description:
        'The ID of the expense to retrieve. You can get this from the "List Expenses" action or the "New Expense" trigger.',
      required: true,
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexExpense>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/expenses/${context.propsValue.expenseId}?expand[]=merchant`,
    });
    return brexCommon.flattenExpense(response.body);
  },
});
