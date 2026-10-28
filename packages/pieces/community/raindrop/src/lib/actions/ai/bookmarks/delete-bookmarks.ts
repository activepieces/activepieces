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
      'Moves every bookmark in a collection that matches the given IDs and/or search to Trash, or the whole collection when neither is set. With collection -99 (Trash) they are deleted permanently. Collection 0 covers every collection except Trash; use Delete Bookmark for a single bookmark.',
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
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only delete bookmarks matching this Raindrop search query, e.g. "#old".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = raindropUtils.toStringList({ value: propsValue.ids });
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
