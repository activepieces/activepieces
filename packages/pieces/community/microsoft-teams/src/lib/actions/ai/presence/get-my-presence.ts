import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetMyPresenceOutputSchema } from '../../../output-schemas';

export const getMyPresence = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_my_presence',
  outputSchema: microsoftTeamsGetMyPresenceOutputSchema,
  displayName: 'Get My Presence',
  description: "Gets the signed-in user's Teams presence.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets the signed-in user's current Teams availability (for example Available, Busy, Away), activity and status message. Use Get User Presence for someone else.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api('/me/presence').get());
  },
});
