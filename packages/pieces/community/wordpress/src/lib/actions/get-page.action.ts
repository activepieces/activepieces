import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { getPageOutputSchema } from '../output-schemas';

export const getPageAction = createAction({
  auth: wordpressAuth,
  name: 'get_page',
  classification: 'READ',
  displayName: 'Get Page',
  description: 'Gets one site page by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one WordPress static page by ID, including drafts the connected user can edit. Get the ID from list_pages or search_site_content; use get_post_by_id for blog posts. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getPageOutputSchema,
  props: {
    page_id: Property.Number({
      displayName: 'Page ID',
      description: 'ID of the page, from list_pages or search_site_content.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const pageId = wordpressContent.requireWholeNumber({ value: propsValue.page_id, propName: 'Page ID' });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/pages/${pageId}`,
    });
    return response.body;
  },
});
