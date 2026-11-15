import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { pageEditOutputSchema } from '../output-schemas';

export const updatePageAction = createAction({
  auth: wordpressAuth,
  name: 'update_page',
  classification: 'WRITE',
  displayName: 'Update Page',
  description: 'Changes only the fields you supply on an existing page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing WordPress static page by ID, sending only the fields you supply; everything else stays as it is. To trash a page use trash_page; use update_blog_post for blog posts. Safe to retry with the same input.',
    idempotent: true,
  },
  outputSchema: pageEditOutputSchema,
  props: {
    page_id: Property.Number({
      displayName: 'Page ID',
      description: 'ID of the page to update, from list_pages.',
      required: true,
    }),
    ...wordpressContent.contentProps({ kind: 'page', mode: 'update' }),
    ...wordpressContent.pageOnlyProps({ mode: 'update' }),
  },
  async run({ auth, propsValue }) {
    const pageId = wordpressContent.requireWholeNumber({ value: propsValue.page_id, propName: 'Page ID' });
    const body = wordpressContent.buildContentBody({ kind: 'page', values: propsValue });
    wordpressContent.requirePatch({ body });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: `/pages/${pageId}`,
      body,
    });
    return response.body;
  },
});
