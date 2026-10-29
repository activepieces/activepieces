import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerDeletedOutputSchema } from '../../output-schemas';

export const deletePlanAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_delete_plan',
  outputSchema: microsoft365PlannerDeletedOutputSchema,
  displayName: 'Delete Plan',
  description: 'Permanently deletes a Planner plan.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Planner plan (Plan ID from List Plans) together with all its buckets and tasks. Cannot be undone; repeating the call fails because the plan no longer exists.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoft365PlannerApi.deletePlan({
      auth,
      planId: propsValue.planId,
    });
    return { success: true, id: propsValue.planId };
  },
});
