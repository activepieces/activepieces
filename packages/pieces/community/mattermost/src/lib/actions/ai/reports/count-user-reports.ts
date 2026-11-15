import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCountUserReportsOutputSchema } from '../../../output-schemas';

export const countUserReportsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_count_user_reports',
  outputSchema: mattermostCountUserReportsOutputSchema,
  displayName: 'Count User Reports',
  description: 'Counts the users an admin user report would list.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many users match the same filters as List User Reports, for sizing a report before paging through it. Needs permission to read users in the System Console.',
    idempotent: true,
  },
  props: {
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
    const { searchTerm, teamFilter } = context.propsValue;
    const count = await mattermostClient.request<number>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/reports/users/count',
      query: {
        ...(searchTerm ? { search_term: searchTerm } : {}),
        ...(teamFilter ? { team_filter: teamFilter } : {}),
      },
    });
    return { count };
  },
});
