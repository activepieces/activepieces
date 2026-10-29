import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerSuccessOutputSchema } from '../output-schemas';

export const updatePlanAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updatePlan',
  outputSchema: microsoft365PlannerSuccessOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Plan',
  description: 'modify metadata of a plan (e.g. title changes).',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Planner plan\'s title, identified by plan ID. Use to rename a plan. Idempotent: setting the same title repeatedly leaves the plan in the same end state.',
    idempotent: true,
  },
  props: {
    id: microsoft365PlannerProps.planId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title of the plan',
      required: true,
    }),
  },
  async run({ auth, propsValue: { id, title } }) {
    if (!id) {
      throw new Error('Plan id is required');
    }
    return await microsoft365PlannerApi.updatePlan({
      auth,
      id,
      title,
    });
  },
});
