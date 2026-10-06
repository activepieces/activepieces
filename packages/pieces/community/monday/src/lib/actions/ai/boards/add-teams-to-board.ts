import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { addTeamsToBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const addTeamsToBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_teams_to_board',
  classification: 'WRITE',
  displayName: 'Add Teams to Board',
  description: 'Adds teams to a board as subscribers or owners.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Give whole teams access to a monday.com board as subscribers or owners. Use to share a board with a team; to share with individual people use Add Users to Board. Requires board-owner rights. Re-adding teams already on the board leaves them unchanged, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: addTeamsToBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    team_ids: mondayAiProps.teamIds(),
    kind: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      defaultValue: 'subscriber',
      options: {
        options: [
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'Owner', value: 'owner' },
        ],
      },
    }),
  },
  async run(context) {
    const { board_id, kind } = context.propsValue;
    const teamIds = mondayApi.toStringArray(context.propsValue.team_ids);
    if (teamIds.length === 0) {
      throw new Error('Provide at least one team ID.');
    }

    const data = await makeClient(context.auth).query<{ add_teams_to_board: { id: string; name: string }[] | null }>({
      query: `mutation ($board_id: ID!, $team_ids: [ID!]!, $kind: BoardSubscriberKind) {
        add_teams_to_board(board_id: $board_id, team_ids: $team_ids, kind: $kind) { id name }
      }`,
      variables: { board_id, team_ids: teamIds, kind },
    });

    const teams = (data.add_teams_to_board ?? []).map((team) => ({
      id: team.id,
      name: team.name,
    }));

    return { board_id, role: kind, teams, count: teams.length };
  },
});
