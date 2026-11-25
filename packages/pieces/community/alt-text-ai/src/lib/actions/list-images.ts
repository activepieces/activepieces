import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequestWithHeaders, buildImagePage, MAX_PAGE_LIMIT, readPaging } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const listImagesAction = createAction({
  name: 'list-images',
  auth: altTextAiAuth,
  displayName: 'List Images',
  description: 'Lists images in your AltText.ai library, one page at a time, optionally filtered by exact image URL.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of images (asset ID, URL, alt text, tags) from the AltText.ai library, newest first. Use to discover asset IDs, or pass an exact image URL to check whether alt text already exists for it before spending a credit. Returns total_count and total_pages; call again with page = next_page to continue (next_page is empty on the last page). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: altTextAiOutputSchemas.imageList,
  props: {
    url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Only return the image with exactly this URL.',
      required: false,
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
    const { url, page, limit } = context.propsValue;
    const { pageNumber, pageSize } = readPaging({ page, limit });
    const queryParams: Record<string, string> = {
      page: String(pageNumber),
      limit: String(pageSize),
    };
    const trimmedUrl = url?.trim();
    if (trimmedUrl) {
      queryParams['url'] = trimmedUrl;
    }
    const { body, headers } = await altTextAiRequestWithHeaders({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/images',
      operation: 'List Images',
      queryParams,
    });
    return buildImagePage({ body, headers, pageNumber, pageSize });
  },
});
