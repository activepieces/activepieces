import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const listChannels = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_channels',
  displayName: 'List Channels',
  description: 'Lists the channels of a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the channels the signed-in user can see in one team, with each channel ID and membership type. Team IDs come from List Joined Teams. Use List All Channels to also include channels shared into the team.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description: "An OData $filter on channel properties, for example membershipType eq 'private'.",
      required: false,
    }),
  },
  async run(context) {
    const { teamId, filter } = context.propsValue;
    return await microsoftTeamsClient.list({ auth: context.auth, path: `/teams/${teamId}/channels`, filter });
  },
});
