import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanDetailsOutputSchema } from '../../output-schemas';

export const updatePlanDetailsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_update_plan_details',
  outputSchema: microsoft365PlannerPlanDetailsOutputSchema,
  displayName: 'Update Plan Details',
  description: 'Renames a plan’s label categories.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the names of a Planner plan’s label categories (Plan ID from List Plans) and returns the updated details. Only the categories you pass change; pass null for a category to remove its name.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
    categoryLabels: Property.Json({
      displayName: 'Category Labels',
      description:
        'Object mapping category keys (category1 to category25) to label names, e.g. {"category1": "Urgent", "category2": null}. null removes a label name.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const categoryLabels = propsValue.categoryLabels;
    if (
      typeof categoryLabels !== 'object' ||
      categoryLabels === null ||
      Array.isArray(categoryLabels)
    ) {
      throw new Error(
        'Category Labels must be an object such as {"category1": "Urgent"}.'
      );
    }
    return await microsoft365PlannerApi.patchPlanDetails({
      auth,
      planId: propsValue.planId,
      categoryDescriptions: categoryLabels,
    });
  },
});
