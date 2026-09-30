import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { postEditOutputSchema } from '../output-schemas';

export const createBlogPostAction = createAction({
  auth: wordpressAuth,
  name: 'create_blog_post',
  classification: 'WRITE',
  displayName: 'Create Blog Post',
  description: 'Creates a blog post. Saved as a draft unless a status is given.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a WordPress blog post from HTML content, optionally with categories, tags and a featured image. With no status the post is saved as a draft; set status "publish" to publish now, or "future" with a Publish Date to schedule (a past date publishes immediately). Custom ACF fields can be set by field name when the site exposes ACF over the REST API. Use create_site_page for static pages. Each call creates a new post, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: postEditOutputSchema,
  props: {
    ...wordpressContent.contentProps({ kind: 'post', mode: 'create' }),
    ...wordpressContent.postOnlyProps({ mode: 'create' }),
  },
  async run({ auth, propsValue }) {
    wordpressContent.requireDateForFuture({ values: propsValue });
    const body = wordpressContent.buildContentBody({ kind: 'post', values: propsValue });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: '/posts',
      body,
    });
    return response.body;
  },
});
