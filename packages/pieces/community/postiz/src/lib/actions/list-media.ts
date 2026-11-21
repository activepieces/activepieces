import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall } from '../common';

function toPage({ value }: { value: unknown }): number {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a whole number of 1 or more.');
  }
  return page;
}

export const listMedia = createAction({
  auth: postizAuth,
  name: 'list_media',
  classification: 'SEARCH',
  displayName: 'List Media',
  description: 'Lists files in your Postiz media library, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists files already uploaded to the Postiz media library, newest first, 18 per page, optionally filtered by original file name. Use to find the media ID or path to attach to a post. Returns the total page count; request the next page while page is below pages. Idempotent: read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'pages', label: 'Total Pages', format: 'number' },
      {
        key: 'results',
        label: 'Media',
        labelKey: 'original_name',
        listItems: [
          { key: 'id', label: 'Media ID' },
          { key: 'name', label: 'Name' },
          { key: 'original_name', label: 'Original Name' },
          { key: 'path', label: 'Path', format: 'url' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter by original file name.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const page = toPage({ value: propsValue.page });
    const queryParams: Record<string, string> = { page: String(page) };
    const search = propsValue.search?.trim();
    if (search) {
      queryParams['search'] = search;
    }
    const response = await postizApiCall<{
      pages?: number;
      results?: { id: string; name?: string; originalName?: string; path: string; createdAt?: string }[];
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/media',
      queryParams,
    });
    return {
      page,
      pages: response.body?.pages ?? 0,
      results: (response.body?.results ?? []).map((item) => ({
        id: item.id,
        name: item.name ?? null,
        original_name: item.originalName ?? null,
        path: item.path,
        created_at: item.createdAt ?? null,
      })),
    };
  },
});
