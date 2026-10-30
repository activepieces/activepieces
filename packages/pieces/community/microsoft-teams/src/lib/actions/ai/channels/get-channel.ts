import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getChannel = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_channel',
  displayName: 'Get Channel',
  description: 'Gets one channel of a team by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one channel of a team by its ID, with its name, description, membership type and web URL. Team IDs come from List Joined Teams and channel IDs from List Channels or List All Channels.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
  },
  async run(context) {
    const { teamId, channelId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/teams/${teamId}/channels/${channelId}`).get());
  },
});
