import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditDeleteMessageOutputSchema } from '../../output-schemas';

export const redditDeleteMessage = createAction({
  auth: redditAuth,
  name: 'reddit_delete_message',
  outputSchema: redditDeleteMessageOutputSchema,
  displayName: 'Delete Message',
  description: 'Deletes a private message from your inbox.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a received private message from your inbox; the other party keeps their copy. Accepts the message id with or without the t4_ prefix, from List Messages. Cannot be undone. Needs the `privatemessages` scope: older connections must reconnect.',
    idempotent: false,
  },
  props: {
    message_id: Property.ShortText({ displayName: 'Message ID', description: 'Message id, e.g. "abc123" or "t4_abc123".', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.toFullname({ value: propsValue.message_id, prefix: 't4_' });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/del_msg', form: { id } });
    return { success: true, id };
  },
});
