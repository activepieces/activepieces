import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { removeTeamsFromBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const removeTeamsFromBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_remove_teams_from_board',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Teams from Board',
  description: 'Removes teams from a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Revoke whole teams' access to a monday.com board. Use to unshare a board with a team; to remove individual people use Remove Users from Board. Requires board-owner rights. Removing teams that are no longer on the board has no further effect.",
    idempotent: true,
  },
  outputSchema: removeTeamsFromBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    team_ids: mondayAiProps.teamIds(),
  },
  async run(context) {
    const { board_id } = context.propsValue;
    const teamIds = mondayApi.toStringArray(context.propsValue.team_ids);
    if (teamIds.length === 0) {
      throw new Error('Provide at least one team ID.');
    }

    const data = await makeClient(context.auth).query<{ delete_teams_from_board: { id: string; name: string }[] | null }>({
      query: `mutation ($board_id: ID!, $team_ids: [ID!]!) {
        delete_teams_from_board(board_id: $board_id, team_ids: $team_ids) { id name }
      }`,
      variables: { board_id, team_ids: teamIds },
    });

    const teams = (data.delete_teams_from_board ?? []).map((team) => ({
      id: team.id,
      name: team.name,
    }));

    return { board_id, removed_teams: teams, count: teams.length };
  },
});
