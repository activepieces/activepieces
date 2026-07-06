import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown } from '../common/properties';

export const updatePlan = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updatePlan',
  displayName: 'Update Plan',
  description: 'modify metadata of a plan (e.g. title changes).',
  audience: 'both',
  aiMetadata: {
    description: 'Updates an existing Planner plan\'s title, identified by plan ID. Use to rename a plan. Idempotent: setting the same title repeatedly leaves the plan in the same end state.',
    idempotent: true,
  },
  props: {
    id: PlanDropdown({ required: true }),
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
    return await microsoft365PlannerCommon.updatePlan({
      auth,
      id,
      title,
    });
  },
});
