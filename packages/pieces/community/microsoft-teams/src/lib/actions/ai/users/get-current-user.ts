import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetCurrentUserOutputSchema } from '../../../output-schemas';

export const getCurrentUser = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_current_user',
  outputSchema: microsoftTeamsGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Gets the profile of the signed-in user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets the signed-in user's profile: user ID, display name, email and user principal name. Use it to learn who the connection acts as, for example before creating a chat that must include the signed-in user.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api('/me').get());
  },
});
