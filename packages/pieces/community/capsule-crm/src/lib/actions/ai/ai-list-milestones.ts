import { createAction } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { milestonesOutputSchema } from '../../common/output-schemas';

export const aiListMilestones = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_milestones',
  classification: 'READ',
  displayName: 'List Milestones',
  description: 'Lists pipeline milestones.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the sales pipeline milestones with their numeric IDs, probability and pipeline. Use an id as Milestone ID when creating or updating opportunities. Read-only.',
    idempotent: true,
  },
  outputSchema: milestonesOutputSchema,
  props: {

  },
  async run({ auth }) {
    return { milestones: await capsuleCrmClient.listMilestones({ auth }) };
  },
});
