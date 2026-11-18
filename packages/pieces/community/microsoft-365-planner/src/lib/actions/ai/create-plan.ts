import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanOutputSchema } from '../../output-schemas';

export const createPlanAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_create_plan',
  outputSchema: microsoft365PlannerPlanOutputSchema,
  displayName: 'Create Plan',
  description: 'Creates a Planner plan owned by a Microsoft 365 group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new Planner plan owned by a Microsoft 365 group (Group ID from List Groups). The signed-in user must be a member of the group. Each call creates another plan.',
    idempotent: false,
  },
  props: {
    groupId: microsoft365PlannerAiProps.groupId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the new plan.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.createPlan({
      auth,
      groupId: propsValue.groupId,
      title: propsValue.title,
    });
  },
});
