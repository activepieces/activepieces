import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropDeleteBookmarksOutputSchema } from '../../../output-schemas';

export const raindropDeleteBookmarksAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_bookmarks',
  outputSchema: raindropDeleteBookmarksOutputSchema,
  displayName: 'Delete Bookmarks',
  description: 'Moves many bookmarks in a collection to Trash at once.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves every bookmark in a collection that matches the given IDs and/or search to Trash, or the whole collection when All Bookmarks is true (an empty ID list never means all). With collection -99 (Trash) they are deleted permanently. Collection 0 covers every collection except Trash; use Delete Bookmark for a single bookmark.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description:
        'Collection ID holding the bookmarks, from List Collections. -1 = Unsorted, -99 = Trash (permanent delete); 0 = all collections except Trash.',
    }),
    ids: Property.Array({
      displayName: 'Bookmark IDs',
      description: 'Only delete these bookmark IDs, from List Bookmarks.',
      required: false,
    }),
    allBookmarks: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'All Bookmarks',
      description:
        'Set to true to delete every bookmark in the collection. Required when neither Bookmark IDs nor Search is set.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only delete bookmarks matching this Raindrop search query, e.g. "#old".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = raindropUtils.toStringList({ value: propsValue.ids });
    const allBookmarks = raindropUtils.toBoolean({ value: propsValue.allBookmarks }) === true;
    const filtered = ids.length > 0 || (propsValue.search ?? '') !== '';
    if (allBookmarks && filtered) {
      throw new Error('Set either All Bookmarks or Bookmark IDs / Search, not both.');
    }
    if (!allBookmarks && !filtered) {
      throw new Error(
        'Set Bookmark IDs or Search, or set All Bookmarks to true to delete the whole collection.',
      );
    }
    return await raindropClient.request<RaindropDeleteBookmarksResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/raindrops/${encodeURIComponent(propsValue.collectionId)}`,
      query: propsValue.search !== undefined ? { search: propsValue.search } : undefined,
      body: ids.length > 0 ? { ids } : undefined,
    });
  },
});

type RaindropDeleteBookmarksResponse = {
  result: boolean;
  modified: number;
};
