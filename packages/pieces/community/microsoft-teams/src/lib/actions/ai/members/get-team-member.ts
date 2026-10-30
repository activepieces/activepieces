import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetChatMemberOutputSchema } from '../../../output-schemas';

export const getTeamMember = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_team_member',
  outputSchema: microsoftTeamsGetChatMemberOutputSchema,
  displayName: 'Get Team Member',
  description: 'Gets one membership of a team by its membership ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one team membership by its membership ID, with the user ID, display name, email and roles (owner or member). Membership IDs come from List Team Members; they are not user IDs.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    membershipId: Property.ShortText({
      displayName: 'Membership ID',
      description: 'The membership ID (the id field), from List Team Members.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, membershipId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/teams/${teamId}/members/${membershipId}`).get());
  },
});
