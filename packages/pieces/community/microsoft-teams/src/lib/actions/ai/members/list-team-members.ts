import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListTeamMembersOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 999;
const DEFAULT_LIMIT = 100;

export const listTeamMembers = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_team_members',
  outputSchema: microsoftTeamsListTeamMembersOutputSchema,
  displayName: 'List Team Members',
  description: 'Lists the members of a team, optionally only those with an exact email or display name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the members of one team with each membership ID, user ID, email and roles, one page at a time; set Email or Display Name to find one person (exact match). Team IDs come from List Joined Teams; pass @odata.nextLink back as Next Page Link for the next page.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Only return the member with exactly this email address.',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Only return members with exactly this display name.',
      required: false,
    }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { teamId, email, displayName, limit, nextLink } = context.propsValue;
    if (email && displayName) {
      throw new Error('Set either Email or Display Name, not both.');
    }
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/teams/${teamId}/members`,
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      filter: buildFilter({ email, displayName }),
      nextLink,
    });
  },
});

function buildFilter({ email, displayName }: { email?: string; displayName?: string }): string | undefined {
  if (email) return `microsoft.graph.aadUserConversationMember/email eq '${email.replace(/'/g, "''")}'`;
  if (displayName) return `microsoft.graph.aadUserConversationMember/displayName eq '${displayName.replace(/'/g, "''")}'`;
  return undefined;
}
