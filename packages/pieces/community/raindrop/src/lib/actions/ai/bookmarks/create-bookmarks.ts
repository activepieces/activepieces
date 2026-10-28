import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropCreateBookmarksOutputSchema } from '../../../output-schemas';

export const raindropCreateBookmarksAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_create_bookmarks',
  outputSchema: raindropCreateBookmarksOutputSchema,
  displayName: 'Create Bookmarks',
  description: 'Saves up to 100 bookmarks in one call.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves 1 to 100 bookmarks in one call; each item needs a "link" and may set title, excerpt, note, tags, important and collection ({"$id": <ID from List Collections>}). Use Create Bookmark for a single URL. Not idempotent: repeating it saves duplicates (use Check URLs Exist first).',
    idempotent: false,
  },
  props: {
    items: Property.Json({
      displayName: 'Bookmarks',
      description:
        'JSON array of 1 to 100 bookmark objects, e.g. [{"link": "https://example.com", "title": "Example", "tags": ["ai"], "collection": {"$id": 123}}]. Missing title, excerpt and cover are parsed from the page.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const items: unknown = propsValue.items;
    if (!isBookmarkList(items) || items.length === 0 || items.length > 100) {
      throw new Error(
        'Bookmarks must be a JSON array of 1 to 100 objects, each with a non-empty "link".',
      );
    }
    return await raindropClient.request<RaindropCreateBookmarksResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/raindrops',
      body: { items: items.map((item) => ({ pleaseParse: {}, ...item })) },
    });
  },
});

function isBookmarkList(value: unknown): value is BookmarkInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        !Array.isArray(item) &&
        'link' in item &&
        typeof item.link === 'string' &&
        item.link !== '',
    )
  );
}

type BookmarkInput = Record<string, unknown> & { link: string };

type RaindropCreateBookmarksResponse = {
  result: boolean;
  items: Record<string, unknown>[];
};
