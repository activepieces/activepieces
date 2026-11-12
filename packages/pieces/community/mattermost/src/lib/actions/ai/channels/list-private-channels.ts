import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetChannelsByIdsOutputSchema } from '../../../output-schemas';

export const listPrivateChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_private_channels',
  outputSchema: mattermostGetChannelsByIdsOutputSchema,
  displayName: 'List Private Channels',
  description: 'Lists all private channels of a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of every private channel in a team, including ones the connected user is not in. Needs the manage_system permission; regular users can see their own private channels with List User Team Channels.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { teamId, page, perPage } = context.propsValue;
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(teamId)}/channels/private`,
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { channels, count: channels.length };
  },
});
