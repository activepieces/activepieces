import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanOutputSchema } from '../../output-schemas';

export const updatePlanAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_update_plan',
  outputSchema: microsoft365PlannerPlanOutputSchema,
  displayName: 'Update Plan',
  description: 'Renames a Planner plan.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames a Planner plan (Plan ID from List Plans) and returns the updated plan. Category labels are changed with Update Plan Details.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title of the plan.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.patchPlan({
      auth,
      planId: propsValue.planId,
      title: propsValue.title,
    });
  },
});
