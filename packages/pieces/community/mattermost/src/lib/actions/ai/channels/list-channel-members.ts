import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListChannelMembersOutputSchema } from '../../../output-schemas';

export const listChannelMembersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_channel_members',
  outputSchema: mattermostListChannelMembersOutputSchema,
  displayName: 'List Channel Members',
  description: 'Lists the members of a channel.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a page of a channel\'s memberships: user ID, channel roles, and notification settings. Use Get User for each member\'s profile; for specific users use Get Channel Members By IDs.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { channelId, page, perPage } = context.propsValue;
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(channelId)}/members`,
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { members, count: members.length };
  },
});
