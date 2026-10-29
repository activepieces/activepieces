import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerPlanListOutputSchema } from '../../output-schemas';

export const listPlansAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_plans',
  outputSchema: microsoft365PlannerPlanListOutputSchema,
  displayName: 'List Plans',
  description: 'Lists your Planner plans, or the plans of a group.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Planner plans shared with the signed-in user, or, when Group ID is set, the plans owned by that Microsoft 365 group (from List Groups). Title Contains narrows the result to plans whose title contains the text, case-insensitive. Use it to turn a plan name into the Plan ID other actions need. Without Group ID, Microsoft can leave out plans created recently; set Group ID to be sure a new plan is listed.',
    idempotent: true,
  },
  props: {
    groupId: microsoft365PlannerAiProps.groupId({
      required: false,
      description:
        'Only list the plans of this Microsoft 365 group (from List Groups). Leave empty for every plan shared with you.',
    }),
    titleContains: Property.ShortText({
      displayName: 'Title Contains',
      description:
        'Only return plans whose title contains this text (case-insensitive).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const plans = propsValue.groupId
      ? await microsoft365PlannerApi.listGroupPlans({
          auth,
          groupId: propsValue.groupId,
        })
      : await microsoft365PlannerApi.listAllPlans({ auth });
    const titleContains = propsValue.titleContains?.toLowerCase();
    const matching = titleContains
      ? plans.filter((plan) =>
          plan.title?.toLowerCase().includes(titleContains)
        )
      : plans;
    return { plans: matching, count: matching.length };
  },
});
