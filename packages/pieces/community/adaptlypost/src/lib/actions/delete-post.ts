import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostProps } from '../common/props';

export const deletePostAction = createAction({
  auth: adaptlyPostAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description:
    'Deletes a post from AdaptlyPost. A post that already published stays on the social platforms.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an AdaptlyPost post, which also cancels it if it was scheduled. It does not remove anything already published on the platforms. Use Unschedule Post to keep the content as a draft instead. Cannot be undone; a retry returns not found.',
    idempotent: false,
  },
  props: {
    post_id: adaptlyPostProps.post({
      statuses: adaptlyPostProps.allStatuses,
      description:
        'The post to delete. Pick one, or map a Post ID from an earlier step.',
    }),
  },
  async run(context) {
    const postId = context.propsValue.post_id;
    const response = await adaptlyPostClient.request<{ deleted: boolean }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/social-posts/${encodeURIComponent(postId)}`,
    });
    return { post_id: postId, deleted: response.deleted };
  },
});
