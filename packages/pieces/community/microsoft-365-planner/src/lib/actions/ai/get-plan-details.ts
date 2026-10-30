import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanDetailsOutputSchema } from '../../output-schemas';

export const getPlanDetailsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_plan_details',
  outputSchema: microsoft365PlannerPlanDetailsOutputSchema,
  displayName: 'Get Plan Details',
  description: 'Gets a plan’s category labels and sharing.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the details of a Planner plan (Plan ID from List Plans): the names of its label categories (category1 to category25, used by a task’s applied categories) and who it is shared with.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.getPlanDetails({
      auth,
      planId: propsValue.planId,
    });
  },
});
