import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostGetChannelsByIdsOutputSchema } from '../../../output-schemas';

export const listPublicChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_public_channels',
  outputSchema: mattermostGetChannelsByIdsOutputSchema,
  displayName: 'List Public Channels',
  description: 'Lists the public channels of a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of a team\'s active public channels, whether or not the connected user is a member. For the channels a user belongs to use List User Team Channels; to filter by text use Search Channels.',
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
      path: `/teams/${encodeURIComponent(teamId)}/channels`,
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { channels, count: channels.length };
  },
});
