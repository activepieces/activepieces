import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsCreatePrivateChannelOutputSchema } from '../../../output-schemas';

export const getPrimaryChannel = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_primary_channel',
  outputSchema: microsoftTeamsCreatePrivateChannelOutputSchema,
  displayName: 'Get Primary Channel',
  description: 'Gets the General channel of a team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a team's default General channel, including its channel ID, without listing every channel. Team IDs come from List Joined Teams.",
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { teamId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/teams/${teamId}/primaryChannel`).get());
  },
});
