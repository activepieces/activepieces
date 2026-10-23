import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { trulataRequest } from '../common';

export const listPosts = createAction({
  auth: trulataAuth,
  name: 'list_posts',
  displayName: 'List Blog Posts',
  description: 'Lists the newest published blog posts.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Up to 100 (default 25).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const res = await trulataRequest<{ posts: unknown[] }>(
      context.auth.secret_text,
      HttpMethod.GET,
      '/posts',
      undefined,
      { limit: String(context.propsValue.limit ?? 25) }
    );
    return res.posts;
  },
});
