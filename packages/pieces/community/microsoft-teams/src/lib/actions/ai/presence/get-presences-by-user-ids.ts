import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';

export const getPresencesByUserIds = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_presences_by_user_ids',
  displayName: 'Get Presences by User IDs',
  description: 'Gets the Teams presence of several users at once.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the current Teams availability, activity and status message of up to 650 users in one call, by user ID (GUIDs from List Users or Get User). Use Get User Presence for a single user.',
    idempotent: true,
  },
  props: {
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (GUIDs), from List Users or Get User. At most 650.',
      required: true,
    }),
  },
  async run(context) {
    const ids = context.propsValue.userIds.map((id) => String(id));
    if (ids.length === 0 || ids.length > MAX_IDS) {
      throw new Error(`User IDs must contain between 1 and ${MAX_IDS} IDs.`);
    }
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() =>
      client.api('/communications/getPresencesByUserId').post({ ids }),
    );
  },
});

const MAX_IDS = 650;
