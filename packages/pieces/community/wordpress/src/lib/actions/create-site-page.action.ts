import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { pageEditOutputSchema } from '../output-schemas';

export const createSitePageAction = createAction({
  auth: wordpressAuth,
  name: 'create_site_page',
  classification: 'WRITE',
  displayName: 'Create Site Page',
  description: 'Creates a static page. Saved as a draft unless a status is given.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a WordPress static page (About, Contact and similar) from HTML content, optionally under a parent page. With no status the page is saved as a draft; set status "publish" to publish now. Use create_blog_post for dated blog posts. Each call creates a new page, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: pageEditOutputSchema,
  props: {
    ...wordpressContent.contentProps({ kind: 'page', mode: 'create' }),
    ...wordpressContent.pageOnlyProps({ mode: 'create' }),
  },
  async run({ auth, propsValue }) {
    wordpressContent.requireDateForFuture({ values: propsValue });
    const body = wordpressContent.buildContentBody({ kind: 'page', values: propsValue });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: '/pages',
      body,
    });
    return response.body;
  },
});
