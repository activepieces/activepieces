import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditMarkAllMessagesReadOutputSchema } from '../../output-schemas';

export const redditMarkAllMessagesRead = createAction({
  auth: redditAuth,
  name: 'reddit_mark_all_messages_read',
  outputSchema: redditMarkAllMessagesReadOutputSchema,
  displayName: 'Mark All Messages Read',
  description: 'Marks every item in your inbox as read.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every unread inbox item (messages, replies, mentions) as read. Reddit processes it asynchronously, so List Messages may show unread items for a few seconds. Needs the `privatemessages` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/read_all_messages', form: {} });
    return { success: true };
  },
});
