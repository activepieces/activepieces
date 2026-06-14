import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hootsuiteAuth } from '../auth';
import { hootsuiteApiCall } from '../common';

export const deleteMessageAction = createAction({
  auth: hootsuiteAuth,
  name: 'delete_message',
  displayName: 'Delete Post',
  description: 'Permanently deletes a post. Only posts in a deletable state (e.g. SCHEDULED) can be removed.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a Hootsuite post by its ID. Use to cancel or remove a scheduled post before it sends. Only posts in a deletable state (e.g. SCHEDULED) can be removed; already-sent posts cannot. Not idempotent: the first call removes the post and subsequent calls with the same ID will fail since it no longer exists.', idempotent: false },
  props: {
    messageId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The unique ID of the post to delete. You can get this from the "Schedule Post" or "Get Post Details" action.',
      required: true,
    }),
  },
  async run(context) {
    await hootsuiteApiCall({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/messages/${context.propsValue.messageId}`,
    });

    return {
      success: true,
      deleted_message_id: context.propsValue.messageId,
    };
  },
});
