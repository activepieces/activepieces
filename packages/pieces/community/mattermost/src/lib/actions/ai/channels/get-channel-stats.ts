import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelStatsOutputSchema } from '../../../output-schemas';

export const getChannelStatsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_stats',
  outputSchema: mattermostGetChannelStatsOutputSchema,
  displayName: 'Get Channel Stats',
  description: 'Gets a channel\'s member, pinned post and file counts.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns counts for one channel: members, pinned posts and files. For member counts of several channels at once use Get Channel Member Counts.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}/stats`,
    });
  },
});
