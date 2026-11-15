import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostClient } from '../common/client';
import { cancelPostOutputSchema } from '../common/output-schemas';

export const cancelPost = createAction({
  auth: letmepostAuth,
  name: 'cancel_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel a Scheduled Post',
  description: 'Cancel a queued scheduled post before it publishes',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels one queued scheduled post by its letmepost post id so it never publishes; the post moves to status canceled. Only works while the post is still queued and its time has not passed; otherwise letmepost answers 409 with rule post.status or post.scheduledAt.window. To move a post to another time use Reschedule a Post instead. Cannot be undone, and a second call on the same post fails.',
    idempotent: false,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The letmepost post id of the queued post (from the Post IDs of a publish, or List Posts).',
      required: true,
    }),
  },
  outputSchema: cancelPostOutputSchema,
  async run(context) {
    return letmepostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/v1/posts/${letmepostClient.segment({ value: context.propsValue.postId, label: 'Post ID' })}`,
      operation: 'cancel the post',
    });
  },
});
