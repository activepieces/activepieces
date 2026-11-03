import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostListUserReportsOutputSchema } from '../../../output-schemas';

export const listUserReportsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_reports',
  outputSchema: mattermostListUserReportsOutputSchema,
  displayName: 'List User Reports',
  description: 'Lists users with activity stats for admin reporting.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a sorted page of users with their activity stats (last login, last post, post counts) for admin reporting. Needs permission to read users in the System Console. To page, pass the last row\'s sort-column value and ID as From Column Value and From ID.',
    idempotent: true,
  },
  props: {
    sortColumn: Property.StaticDropdown({
      displayName: 'Sort Column',
      description: 'Column to sort by. Defaults to "Username".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Username', value: 'Username' },
          { label: 'Email', value: 'Email' },
          { label: 'Create At', value: 'CreateAt' },
          { label: 'Display Name', value: 'DisplayName' },
          { label: 'Last Login At', value: 'LastLoginAt' },
          { label: 'Last Status At', value: 'LastStatusAt' },
          { label: 'Last Post Date', value: 'LastPostDate' },
          { label: 'Days Active', value: 'DaysActive' },
          { label: 'Total Posts', value: 'TotalPosts' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: '"asc" or "desc". Defaults to "asc".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Users per page, 1 to 100. Defaults to 50.',
      required: false,
    }),
    fromColumnValue: Property.ShortText({
      displayName: 'From Column Value',
      description: 'Sort-column value of the last user on the previous page, to get the next page.',
      required: false,
    }),
    fromId: Property.ShortText({
      displayName: 'From ID',
      description: 'ID of the last user on the previous page, to get the next page.',
      required: false,
    }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Filters users by username, name or email.',
      required: false,
    }),
    teamFilter: Property.ShortText({
      displayName: 'Team ID',
      description: 'Only users in this team.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const users = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/reports/users',
      query: {
        sort_column: p.sortColumn ?? 'Username',
        sort_direction: p.sortDirection ?? 'asc',
        page_size: String(Math.min(Math.max(p.pageSize ?? 50, 1), 100)),
        ...(p.fromColumnValue ? { from_column_value: p.fromColumnValue } : {}),
        ...(p.fromId ? { from_id: p.fromId } : {}),
        ...(p.searchTerm ? { search_term: p.searchTerm } : {}),
        ...(p.teamFilter ? { team_filter: p.teamFilter } : {}),
      },
    });
    return { users, count: users.length };
  },
});
