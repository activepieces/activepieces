import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerCurrentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_current_user',
  outputSchema: microsoft365PlannerCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Gets the signed-in Microsoft 365 user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the signed-in Microsoft 365 user: ID, name, email and user principal name. Use the ID to assign tasks to yourself.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await microsoft365PlannerApi.getUser({ auth });
  },
});
