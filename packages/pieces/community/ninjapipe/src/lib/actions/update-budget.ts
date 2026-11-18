import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateBudget = createAction({
  auth: ninjapipeAuth,
  name: 'update_budget',
  classification: 'WRITE',
  displayName: 'Update Budget',
  description: 'Updates a budget. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'both',
  aiMetadata: {
    description: 'Update a NinjaPipe budget by ID. Only filled fields change and Clear Fields empties fields. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.budget,
  props: {
    budgetId: ninjapipeProps.budgetRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    allocated: Property.Number({ displayName: 'Allocated Amount', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    category: ninjapipeProps.staticDropdown({ displayName: 'Category', description: 'Category.', values: ['Marketing', 'Sales', 'Product', 'Operations'] }),
    period: ninjapipeProps.staticDropdown({ displayName: 'Period', description: 'Budget cycle. NinjaPipe derives the end date from the start date and period.', values: ['Monthly', 'Quarterly', 'Yearly'] }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Active', 'Inactive', 'Completed'] }),
    startDate: Property.DateTime({ displayName: 'Start Date', description: 'Date (YYYY-MM-DD).', required: false }),
    endDate: Property.DateTime({ displayName: 'End Date', description: 'Date (YYYY-MM-DD).', required: false }),
    clearFields: ninjapipeProps.clearFields({ fields: { description: 'Description', currency: 'Currency', start_date: 'Start Date', end_date: 'End Date' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/budgets/${ninjapipeClient.pathId({ value: p.budgetId, field: 'Budget' })}`;
    const changes = ninjapipeFields.compact({
      name: p.name,
      allocated: ninjapipeFields.toNumber({ value: p.allocated, field: 'Allocated Amount' }),
      description: p.description,
      category: p.category,
      period: p.period,
      currency: p.currency,
      status: p.status,
      start_date: ninjapipeFields.toDateOnly({ value: p.startDate, field: 'Start Date' }),
      end_date: ninjapipeFields.toDateOnly({ value: p.endDate, field: 'End Date' }),
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'budget' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update budget' });
  },
});
