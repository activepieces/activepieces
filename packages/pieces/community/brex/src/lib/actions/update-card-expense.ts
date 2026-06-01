import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexExpense } from '../common';

export const updateCardExpense = createAction({
  auth: brexAuth,
  name: 'update_card_expense',
  displayName: 'Update Card Expense',
  description: 'Update the memo on a card expense.',
  props: {
    expenseId: Property.ShortText({
      displayName: 'Expense ID',
      description:
        'The ID of the card expense to update. You can get this from the "List Expenses" action (filter by type "Card") or the "New Expense" trigger.',
      required: true,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      description: 'The memo / note to set on the expense.',
      required: true,
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexExpense>({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/v1/expenses/card/${context.propsValue.expenseId}`,
      body: {
        memo: context.propsValue.memo,
      },
    });
    return brexCommon.flattenExpense(response.body);
  },
});
