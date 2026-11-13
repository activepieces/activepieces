import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropDeleteBookmarksOutputSchema } from '../../../output-schemas';

export const raindropUpdateBookmarksAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_bookmarks',
  outputSchema: raindropDeleteBookmarksOutputSchema,
  displayName: 'Update Bookmarks',
  description: 'Updates many bookmarks in a collection at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates every bookmark in a collection that matches the given IDs and/or search, or the whole collection when All Bookmarks is true (an empty ID list never means all): favourite flag, cover, move to another collection, or tags (appended; Clear Tags removes all). Collection 0 covers every collection except Trash. Use Update Bookmark for a single bookmark or to replace its tags.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description:
        'Collection ID holding the bookmarks, from List Collections. -1 = Unsorted, -99 = Trash; 0 = all collections except Trash.',
    }),
    ids: Property.Array({
      displayName: 'Bookmark IDs',
      description: 'Only update these bookmark IDs, from List Bookmarks.',
      required: false,
    }),
    allBookmarks: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'All Bookmarks',
      description:
        'Set to true to update every bookmark in the collection. Required when neither Bookmark IDs nor Search is set.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only update bookmarks matching this Raindrop search query, e.g. "#ai".',
      required: false,
    }),
    important: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Favourite',
      description: 'Mark or unmark the bookmarks as favourites.',
    }),
    tags: raindropAiProps.tags({
      required: false,
      description: 'Tag names to add to the bookmarks, e.g. ["reading"]. Existing tags are kept.',
    }),
    clearTags: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Clear Tags',
      description: 'Remove all tags from the bookmarks. Cannot be combined with Tags.',
    }),
    cover: Property.ShortText({
      displayName: 'Cover URL',
      description: 'Cover image URL to set, or "<screenshot>" to use a page screenshot.',
      required: false,
    }),
    targetCollectionId: raindropAiProps.collectionId({
      required: false,
      displayName: 'Move to Collection ID',
      description: 'Collection ID to move the bookmarks into, from List Collections.',
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
        'Set Bookmark IDs or Search, or set All Bookmarks to true to update the whole collection.',
      );
    }
    const tags = raindropUtils.toStringList({ value: propsValue.tags });
    const clearTags = raindropUtils.toBoolean({ value: propsValue.clearTags }) === true;
    if (clearTags && tags.length > 0) {
      throw new Error('Set either Tags or Clear Tags, not both.');
    }
    const changes: Record<string, unknown> = {
      ...(propsValue.important !== undefined
        ? { important: raindropUtils.toBoolean({ value: propsValue.important }) }
        : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(clearTags ? { tags: [] } : {}),
      ...(propsValue.cover !== undefined ? { cover: propsValue.cover } : {}),
      ...(propsValue.targetCollectionId !== undefined
        ? { collection: { $id: propsValue.targetCollectionId } }
        : {}),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error(
        'Set at least one change: Favourite, Tags, Clear Tags, Cover URL or Move to Collection ID.',
      );
    }
    return await raindropClient.request<RaindropUpdateBookmarksResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrops/${encodeURIComponent(propsValue.collectionId)}`,
      query: propsValue.search !== undefined ? { search: propsValue.search } : undefined,
      body: { ...changes, ...(ids.length > 0 ? { ids } : {}) },
    });
  },
});

type RaindropUpdateBookmarksResponse = {
  result: boolean;
  modified?: number;
};
