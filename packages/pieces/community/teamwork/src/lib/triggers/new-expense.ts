import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newExpenseTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_expense',
  displayName: 'New Expense',
  description: 'Fires when a new expense entry is added.',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "invoice-id": "50",
    "project-id": "1149",
    "name": "4 New Tyres",
    "description": "",
    "created-by-user-firstname": "Daniel",
    "company-id": "51",
    "project-name": "API Private Items",
    "created-by-user-id": "414",
    "created-by-user-lastname": "Mackey",
    "id": "14",
    "date": "20250617",
    "company-name": "Apple",
    "cost": "200.00"
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const expenses = await teamworkClient.getExpenses(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('expenses', expenses);
  },
  async onDisable(context) {
  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

    const newExpenses = await teamworkClient.getExpenses(auth, projectId as string);
    

    const latestExpenses = newExpenses.filter(expense => {
      if (!lastCheckDate) return true;

      const expenseDate = new Date(expense.date.substring(0, 4), expense.date.substring(4, 6) - 1, expense.date.substring(6, 8));
      return expenseDate.toISOString() > lastCheckDate;
    });


    if (latestExpenses.length > 0) {
      await context.store.put('lastCheckDate', latestExpenses[0].date);
    }
    
    return latestExpenses;
  },
});