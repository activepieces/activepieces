import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const listAllChannels = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_all_channels',
  displayName: 'List All Channels',
  description: 'Lists the channels of a team, including channels shared into it.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the channels hosted in one team plus the channels shared into it from other teams, optionally only those whose name matches Channel Name exactly; use it to resolve a channel name to its ID. Team IDs come from List Joined Teams; use List Incoming Channels for only the shared-in channels.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      description: 'Return only channels whose display name is exactly this. Leave empty for every channel.',
      required: false,
    }),
  },
  async run(context) {
    const { teamId, channelName } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/teams/${teamId}/allChannels`,
      filter: channelName === undefined ? undefined : `displayName eq '${channelName.replace(/'/g, "''")}'`,
    });
  },
});
