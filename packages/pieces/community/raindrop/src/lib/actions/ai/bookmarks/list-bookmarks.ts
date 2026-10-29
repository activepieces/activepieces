import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropListBookmarksOutputSchema } from '../../../output-schemas';

export const raindropListBookmarksAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_bookmarks',
  outputSchema: raindropListBookmarksOutputSchema,
  displayName: 'List Bookmarks',
  description: 'Lists bookmarks in a collection, with optional search and sort.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of bookmarks from a collection (0 = all except Trash), optionally filtered by a Raindrop search query and sorted. Use it to find bookmark IDs for Get Bookmark, Update Bookmark or Delete Bookmark. Returns at most 50 bookmarks per call; raise Page to read further. A bookmark created or bulk-updated seconds ago may not match a search yet.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections or List Child Collections. Defaults to 0 (all bookmarks except Trash); -1 = Unsorted, -99 = Trash.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'Raindrop search query, the same text that works in the Raindrop app search box, e.g. "#ai type:article".',
      required: false,
    }),
    sort: raindropAiProps.bookmarkSort({ required: false }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Zero-based page number. Defaults to 0.',
      required: false,
    }),
    perpage: Property.Number({
      displayName: 'Per Page',
      description: 'Bookmarks per page, 1 to 50. Defaults to 25.',
      required: false,
    }),
    nested: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Include Nested Collections',
      description: 'Yes also includes bookmarks from child collections. Defaults to No.',
    }),
  },
  async run({ auth, propsValue }) {
    const perpage = propsValue.perpage ?? 25;
    if (perpage < 1) {
      throw new Error('Per Page must be at least 1.');
    }
    const nested = raindropUtils.toBoolean({ value: propsValue.nested });
    return await raindropClient.request<RaindropListBookmarksResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/raindrops/${encodeURIComponent(propsValue.collectionId ?? '0')}`,
      query: {
        page: String(propsValue.page ?? 0),
        perpage: String(Math.min(perpage, 50)),
        ...(propsValue.search !== undefined ? { search: propsValue.search } : {}),
        ...(propsValue.sort !== undefined ? { sort: propsValue.sort } : {}),
        ...(nested === true ? { nested: 'true' } : {}),
      },
    });
  },
});

type RaindropListBookmarksResponse = {
  result: boolean;
  items: Record<string, unknown>[];
  count: number;
  collectionId: number;
};
