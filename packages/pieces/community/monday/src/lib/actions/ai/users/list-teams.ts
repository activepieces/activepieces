import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { listTeamsActionOutputSchema } from '../../../output-schemas';

export const listTeamsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description: 'Lists teams in the monday.com account with their members and owners.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com teams (optionally only given team IDs) with their member and owner user IDs and names. Use to resolve team IDs for board or workspace access, or to see who belongs to a team. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listTeamsActionOutputSchema,
  props: {
    team_ids: Property.Array({
      displayName: 'Team IDs',
      description: 'Only return these team IDs. Leave empty for all teams.',
      required: false,
    }),
  },
  async run(context) {
    const teamIds = mondayApi.toStringArray(context.propsValue.team_ids);

    const data = await makeClient(context.auth).query<{ teams: MondayTeam[] | null }>({
      query: `query ($ids: [ID!]) {
        teams(ids: $ids) {
          id
          name
          picture_url
          users { id name email }
          owners { id name }
        }
      }`,
      variables: { ids: teamIds.length > 0 ? teamIds : undefined },
    });

    const teams = (data.teams ?? []).map((team) => {
      const members = (team.users ?? []).filter((u): u is TeamUser => u !== null);
      const owners = team.owners ?? [];
      return {
        id: team.id,
        name: team.name,
        picture_url: team.picture_url ?? null,
        member_count: members.length,
        member_ids: members.map((u) => u.id).join(', ') || null,
        member_names: members.map((u) => u.name).join(', ') || null,
        member_emails: members.map((u) => u.email).join(', ') || null,
        owner_ids: owners.map((u) => u.id).join(', ') || null,
        owner_names: owners.map((u) => u.name).join(', ') || null,
      };
    });

    return { teams, count: teams.length };
  },
});

type TeamUser = { id: string; name: string; email: string };

type MondayTeam = {
  id: string;
  name: string;
  picture_url: string | null;
  users: (TeamUser | null)[] | null;
  owners: { id: string; name: string }[] | null;
};
