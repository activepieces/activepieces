import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getBudget = createAction({
  auth: ninjapipeAuth,
  name: 'get_budget',
  classification: 'READ',
  displayName: 'Get Budget',
  description: 'Gets one budget by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single NinjaPipe budget by ID. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.budget,
  props: {
    budgetId: ninjapipeProps.budgetRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.budgetId, field: 'Budget' });
    return ninjapipeClient.getRecord({ auth: ninjapipeClient.readAuth(context.auth), path: `/budgets/${id}`, operation: 'get budget' });
  },
});
