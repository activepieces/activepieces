import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteBudget = createAction({
  auth: ninjapipeAuth,
  name: 'delete_budget',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Budget',
  description: 'Permanently deletes a budget.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe budget by ID (budgetId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the budget is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    budgetId: ninjapipeProps.budgetRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.budgetId, field: 'Budget' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/budgets/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete budget',
    });
  },
});
