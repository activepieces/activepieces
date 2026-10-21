import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerBucketListOutputSchema } from '../../output-schemas';

export const listBucketsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_buckets',
  outputSchema: microsoft365PlannerBucketListOutputSchema,
  displayName: 'List Buckets',
  description: 'Lists the buckets of a Planner plan.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the buckets (columns) of a Planner plan (Plan ID from List Plans), with each bucket’s ID and name. Use it to find the Bucket ID for creating or moving tasks.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const buckets = await microsoft365PlannerApi.listAllBuckets({
      auth,
      planId: propsValue.planId,
    });
    return { buckets, count: buckets.length };
  },
});
