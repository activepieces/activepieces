import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostMarkThreadReadOutputSchema } from '../../../output-schemas';

export const markThreadReadAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_mark_thread_read',
  outputSchema: mattermostMarkThreadReadOutputSchema,
  displayName: 'Mark Thread Read',
  description: 'Marks a followed thread as read up to a point in time.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the last-read time of a thread a user follows, so replies after Timestamp count as unread; pass "me" for the connected account and the current time to mark it fully read. Use Mark Thread Unread to mark from a specific reply.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'ID (26 characters) of the thread\'s root post. Use List Followed Threads or Get Post Thread to find it.',
      required: true,
    }),
    timestamp: Property.Number({
      displayName: 'Timestamp',
      description: 'Read up to this time, in milliseconds since epoch.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, threadId, timestamp } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads/${encodeURIComponent(threadId)}/read/${encodeURIComponent(String(timestamp))}`,
    });
  },
});
