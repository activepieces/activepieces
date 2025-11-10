import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createExpenseAction = createAction({
  auth: mycaseAuth,
  name: 'create_expense',
  displayName: 'Create Expense',
  description: 'Creates a new expense',
  props: {
    description: Property.ShortText({ displayName: 'Description', required: true }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createExpense({ 
      description: context.propsValue.description,
      amount: context.propsValue.amount 
    });
  },
});

