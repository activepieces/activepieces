import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createExpenseAction = createAction({
  auth: teamworkAuth,
  name: 'create_expense',
  displayName: 'Create Expense',
  description: 'Log a new expense in a project with cost, description, and date.',
  props: {
    project_id: teamworkProps.project_id(true),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the expense (e.g., "Software License").',
      required: true,
    }),
    cost: Property.Number({
      displayName: 'Cost',
      description: 'The cost of the expense.',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date the expense was incurred.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the expense.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, name, cost, date, description } = propsValue;

    const expenseData = {
      'project-id': project_id,
      name,
      cost,
      date,
      description,
    };

    return await teamworkClient.createExpense(auth as TeamworkAuth, expenseData);
  },
});