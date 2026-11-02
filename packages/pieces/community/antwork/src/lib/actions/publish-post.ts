import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { antworkAuth } from '../auth';
import { antworkApiCall, antworkCommon, idempotencyKey } from '../common';

export const publishPost = createAction({
  auth: antworkAuth,
  name: 'publish_post',
  classification: 'WRITE',
  displayName: 'Publish Post Now',
  description: 'Publish an existing post to its social account right away. This is public.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes an existing Antwork post (usually from Create Draft Post) to its social account immediately and publicly; it cannot be undone from here. Only call after the user approved the exact post. Needs the `publish` scope. Calling it on a failed post retries it.',
    idempotent: true,
  },
  props: {
    postId: antworkCommon.post('draft'),
  },
  async run(context) {
    const postId = context.propsValue.postId.trim();
    const response = await antworkApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/posts/${encodeURIComponent(postId)}/publish`,
      body: {},
      idempotencyKey: idempotencyKey(context.run.id, `publish-${postId}`, {}),
    });
    return response.body;
  },
});
