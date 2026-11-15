import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createBudget = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget',
  classification: 'WRITE',
  displayName: 'Create Budget',
  description: 'Creates a budget.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a NinjaPipe budget. Required: name, allocated, category, period, and a start_date (end date derived from the period) or an end_date. Not idempotent: each call creates another budget.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.budget,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    allocated: Property.Number({ displayName: 'Allocated Amount', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    category: Property.StaticDropdown({ displayName: 'Category', description: 'Category.', required: true, options: { options: [{ label: 'Marketing', value: 'Marketing' }, { label: 'Sales', value: 'Sales' }, { label: 'Product', value: 'Product' }, { label: 'Operations', value: 'Operations' }] } }),
    period: Property.StaticDropdown({ displayName: 'Period', description: 'Budget cycle. NinjaPipe derives the end date from the start date and period.', required: true, options: { options: [{ label: 'Monthly', value: 'Monthly' }, { label: 'Quarterly', value: 'Quarterly' }, { label: 'Yearly', value: 'Yearly' }] } }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Active', 'Inactive', 'Completed'] }),
    startDate: Property.DateTime({ displayName: 'Start Date', description: 'Date (YYYY-MM-DD).', required: false }),
    endDate: Property.DateTime({ displayName: 'End Date', description: 'Date (YYYY-MM-DD).', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    if (ninjapipeFields.isBlank(p.startDate) && ninjapipeFields.isBlank(p.endDate)) {
      throw new Error('Give a Start Date (the end date is derived from the period) or an End Date.');
    }
    const body = ninjapipeFields.compact({
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
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/budgets',
      body,
      operation: 'create budget',
    });
  },
});
