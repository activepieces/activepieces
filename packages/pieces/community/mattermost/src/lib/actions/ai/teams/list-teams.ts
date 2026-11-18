import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListGroupChannelCommonTeamsOutputSchema } from '../../../output-schemas';

export const listTeamsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_teams',
  outputSchema: mattermostListGroupChannelCommonTeamsOutputSchema,
  displayName: 'List Teams',
  description: 'Lists teams on the server, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of teams. Regular users only see open teams; a system admin connection sees all of them. To find teams by name use Search Teams, for the teams a user belongs to use List User Teams.',
    idempotent: true,
  },
  props: {
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { page, perPage } = context.propsValue;
    const teams = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/teams',
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { teams, count: teams.length };
  },
});
