import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeApiRequest } from '../common/client';
import { buildPairObject } from '../common/helpers';
import { CURRENCIES } from '../common/constants';

export const createBudgetExpense = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget_expense',
  displayName: 'Create Budget Expense',
  description: 'Add an expense to a budget in NinjaPipe',
  props: {
    budgetId: Property.ShortText({
      displayName: 'Budget ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Expense Name',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    category: Property.ShortText({
      displayName: 'Category',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    additionalFields: Property.Array({
      displayName: 'Additional Fields',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const budgetId = propsValue.budgetId as string;

    const body: Record<string, unknown> = {};

    const fieldMappings: Record<string, string> = {
      name: 'name',
      amount: 'amount',
      currency: 'currency',
      category: 'category',
      notes: 'notes',
      date: 'date',
    };

    for (const [prop, field] of Object.entries(fieldMappings)) {
      if (propsValue[prop] !== undefined && propsValue[prop] !== null) {
        body[field] = propsValue[prop];
      }
    }

    const additionalFields = propsValue.additionalFields as Array<{ field: string; type: string; value: string }> | undefined;
    if (additionalFields && additionalFields.length > 0) {
      Object.assign(body, buildPairObject(additionalFields));
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.POST,
      `/budgets/${budgetId}/expenses`,
      body,
    );

    return response;
  },
});
