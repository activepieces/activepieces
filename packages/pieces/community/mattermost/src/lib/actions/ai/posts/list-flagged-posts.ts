import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListFlaggedPostsOutputSchema } from '../../../output-schemas';

export const listFlaggedPostsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_flagged_posts',
  outputSchema: mattermostListFlaggedPostsOutputSchema,
  displayName: 'List Saved Posts',
  description: 'Lists the posts a user has saved (flagged).',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the posts a user has saved (flagged), optionally limited to one team or channel; pass "me" for the connected account. Only posts in channels the user belongs to are returned.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({
      required: false,
      description: 'Only saved posts in this team (26 characters). Use List Teams or Get Team By Name to find it.',
    }),
    channelId: mattermostAiProps.channelId({
      required: false,
      description:
        'Only saved posts in this channel (26 characters). Use Get Channel By Name, Search Channels or List User Channels to find it.',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { userId, teamId, channelId, page, perPage } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/posts/flagged`,
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(teamId ? { team_id: teamId } : {}),
        ...(channelId ? { channel_id: channelId } : {}),
      },
    });
  },
});
