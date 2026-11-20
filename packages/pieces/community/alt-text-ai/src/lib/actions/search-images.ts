import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequestWithHeaders, buildImagePage, MAX_PAGE_LIMIT, readPaging } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const searchImagesAction = createAction({
  name: 'search-images',
  auth: altTextAiAuth,
  displayName: 'Search Images',
  description: 'Searches your AltText.ai library for images whose alt text matches a query.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the AltText.ai library by text and returns matching images (asset ID, URL, alt text, tags). Use to find an image by what it shows when you do not know its asset ID or exact URL. Results are paged: call again with page = next_page to continue (next_page is empty on the last page). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: altTextAiOutputSchemas.imageList,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for in the alt text of your images.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to return, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Number of images per page (1-${MAX_PAGE_LIMIT}).`,
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const query = context.propsValue.query.trim();
    if (query === '') {
      throw new Error('Search Query cannot be empty.');
    }
    const { pageNumber, pageSize } = readPaging({ page: context.propsValue.page, limit: context.propsValue.limit });
    const { body, headers } = await altTextAiRequestWithHeaders({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/images/search',
      operation: 'Search Images',
      queryParams: { q: query, page: String(pageNumber), limit: String(pageSize) },
    });
    return buildImagePage({ body, headers, pageNumber, pageSize });
  },
});
