import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const createBudget = createAction({
  auth: ninjapipeAuth,
  name: 'create_budget',
  displayName: 'Create Budget',
  description: 'Creates a new budget.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    endDate: Property.ShortText({ displayName: 'End Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.description) body.description = p.description;
    if (p.amount !== undefined) body.amount = p.amount;
    if (p.currency) body.currency = p.currency;
    if (p.startDate) body.start_date = p.startDate;
    if (p.endDate) body.end_date = p.endDate;
    if (p.status) body.status = p.status;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: '/budgets', body });
    return flattenCustomFields(response.body);
  },
});
