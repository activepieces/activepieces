import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanOutputSchema } from '../../output-schemas';

export const getPlanAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_plan',
  outputSchema: microsoft365PlannerPlanOutputSchema,
  displayName: 'Get Plan',
  description: 'Gets a Planner plan by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Planner plan by its Plan ID (from List Plans): title, owning group, creator and created time. For category labels use Get Plan Details.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.getPlan({
      auth,
      planId: propsValue.planId,
    });
  },
});
