import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerPlanOutputSchema } from '../output-schemas';

export const createPlanAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createPlan',
  outputSchema: microsoft365PlannerPlanOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Plan',
  description: 'Create a new planner plan',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new Microsoft 365 Planner plan with the given title, owned by a specified Microsoft 365 group. Use to set up a fresh planning board before adding buckets or tasks. The group must already exist; each call creates a separate plan, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    groupId: microsoft365PlannerProps.groupId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the plan',
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
