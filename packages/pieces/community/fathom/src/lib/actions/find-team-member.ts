import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listTeamMembers = createAction({
  auth: fathomAuth,
  name: 'list-team-members',
  displayName: 'List Team Members',
  description: 'Retrieves a paginated list of team members, optionally filtered by team name',
  props: {
    team: Property.ShortText({
      displayName: 'Team Name',
      description: 'Optional team name to filter by (e.g., "Sales", "Engineering")',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
  },
  async run(context) {
    const { team, cursor } = context.propsValue;

    // Build query parameters
    const queryParams: string[] = [];

    if (team) {
      queryParams.push(`team=${encodeURIComponent(team)}`);
    }

    if (cursor) {
      queryParams.push(`cursor=${encodeURIComponent(cursor)}`);
    }

    // Build final path with query string
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const path = `/team_members${queryString}`;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
