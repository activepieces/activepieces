import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const markAllThreadsReadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_mark_all_threads_read',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Mark All Threads Read',
  description: 'Marks every thread a user follows in a team as read.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every thread a user follows in a team as read; pass "me" for the connected account. Use Mark Thread Read for a single thread.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/read`,
    });
  },
});
