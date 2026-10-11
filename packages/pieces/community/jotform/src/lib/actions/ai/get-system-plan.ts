import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetSystemPlanOutputSchema } from '../../output-schemas';

export const getSystemPlan = createAction({
  auth: jotformAuth,
  name: 'jotform_get_system_plan',
  outputSchema: jotformGetSystemPlanOutputSchema,
  classification: 'READ',
  displayName: 'Get System Plan',
  description: 'Get the feature and limit details of a Jotform plan.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the public feature and limit details of a named Jotform plan (e.g. FREE, BRONZE, SILVER, GOLD), useful for comparing the account\'s plan against another tier.',
    idempotent: true,
  },
  props: {
    planName: Property.ShortText({
      displayName: 'Plan Name',
      description: 'The plan name to look up, e.g. "FREE".',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/system/plan/${context.propsValue.planName}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
