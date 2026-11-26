import { createAction } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { milestonesOutputSchema } from '../../common/output-schemas';

export const aiListMilestones = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_milestones',
  classification: 'READ',
  displayName: 'List Milestones',
  description: 'Lists milestones of the oldest active pipeline.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the milestones of the oldest active sales pipeline only (a Capsule API limit; other pipelines are not returned), with numeric IDs, probability and pipeline. Use an id as Milestone ID when creating or updating opportunities. Read-only.',
    idempotent: true,
  },
  outputSchema: milestonesOutputSchema,
  props: {

  },
  async run({ auth }) {
    return { milestones: await capsuleCrmClient.listMilestones({ auth }) };
  },
});
