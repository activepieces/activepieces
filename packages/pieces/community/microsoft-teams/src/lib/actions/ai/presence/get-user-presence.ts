import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getUserPresence = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_user_presence',
  displayName: 'Get User Presence',
  description: "Gets a user's Teams presence.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one user's current Teams availability (for example Available, Busy, Away), activity and status message by user ID. Use Get Presences by User IDs for several people at once and Get My Presence for the signed-in user.",
    idempotent: true,
  },
  props: {
    userId: microsoftTeamsAiProps.userId({
      required: true,
      description: 'The user ID (a GUID), from List Users or Get User.',
    }),
  },
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/users/${context.propsValue.userId}/presence`).get());
  },
});
