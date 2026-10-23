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
      'List Bannerbear images page by page (V2 keys allow 1-100 per page; V5 keys always return 25). Use Get Image when you already have an ID. Check has_more and raise page to read further. Read-only.',
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
      description: 'Images per page, 1 to 100. V5 keys always get 25.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const page = bannerbearClient.clampPage(propsValue.page);
    const isV5 = bannerbearClient.getVersion(apiKey) === 'v5';
    const limit = isV5
      ? V5_PAGE_SIZE
      : bannerbearClient.clampLimit(propsValue.limit);
    const queryParams: QueryParams = { page: String(page) };
    if (!isV5) {
      queryParams['limit'] = String(limit);
    }
    const raw = await bannerbearClient.request<RawImage[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/images',
      queryParams,
    });
    return {
      items: raw.map((i) => bannerbearClient.normalizeImage(i)),
      page,
      has_more: raw.length >= limit,
    };
  },
});

const V5_PAGE_SIZE = 25;
