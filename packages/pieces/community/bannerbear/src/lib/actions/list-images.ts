import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawImage } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const listImagesAction = createAction({
  auth: bannerbearAuth,
  name: 'list_images',
  classification: 'SEARCH',
  displayName: 'List Images',
  description: 'List images, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Bannerbear images page by page (1-100 per page). Use Get Image when you already have an ID. Check has_more and raise page to read further. Read-only.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['listImages'],
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Per Page',
      description: 'Images per page, 1 to 100.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const page = bannerbearClient.clampPage(propsValue.page);
    const limit = bannerbearClient.clampLimit(propsValue.limit);
    const queryParams: QueryParams = { page: String(page), limit: String(limit) };
    const raw = await bannerbearClient.request<RawImage[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/images',
      queryParams,
    });
    return {
      items: raw.map((i) => bannerbearClient.normalizeImage(i)),
      page,
      has_more: raw.length >= fullPageSize({ apiKey, limit }),
    };
  },
});

// V5 honours `limit`, but if the server ever caps pages at 25 a short page
// must still count as full, otherwise has_more would stop agents early.
export function fullPageSize({
  apiKey,
  limit,
}: {
  apiKey: string;
  limit: number;
}): number {
  return bannerbearClient.getVersion(apiKey) === 'v5'
    ? Math.min(limit, V5_MAX_SERVER_PAGE)
    : limit;
}

const V5_MAX_SERVER_PAGE = 25;
