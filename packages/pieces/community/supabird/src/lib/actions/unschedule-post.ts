import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { supabirdRequest } from '../common/client';

export const unschedulePostAction = createAction({
  auth: supabirdAuth,
  name: 'unschedule_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Unschedule Post',
  description:
    'Cancel a scheduled post. A post that has not gone out moves to your SupaBird drafts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancel a scheduled SupaBird post by id on X and every other network. A post that has not published moves to Drafts; a scheduled repost is cancelled. A retry fails because the post is no longer scheduled.',
    idempotent: false,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The ID of the scheduled post, for example 6afe0717f47f2d00029cd71e. Use the ID returned by Create Post or by the New Scheduled Post trigger.',
      required: true,
    }),
  },
  async run(context) {
    const { body } = await supabirdRequest({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/posts/${encodeURIComponent(context.propsValue.postId.trim())}`,
    });
    return body;
  },
});
