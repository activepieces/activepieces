import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChannelMessageHostedContentsOutputSchema } from '../../../output-schemas';

export const listIncomingChannels = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_incoming_channels',
  outputSchema: microsoftTeamsListChannelMessageHostedContentsOutputSchema,
  displayName: 'List Incoming Channels',
  description: 'Lists the channels shared into a team from other teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists only the shared channels that other teams have shared into one team, not the team's own channels. Team IDs come from List Joined Teams; use List All Channels for the team's own and shared-in channels together.",
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { teamId } = context.propsValue;
    return await microsoftTeamsClient.list({ auth: context.auth, path: `/teams/${teamId}/incomingChannels` });
  },
});
