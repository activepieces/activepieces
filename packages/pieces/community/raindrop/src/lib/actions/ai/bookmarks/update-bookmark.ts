import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropUpdateBookmarkOutputSchema } from '../../../output-schemas';

export const raindropUpdateBookmarkAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_bookmark',
  outputSchema: raindropUpdateBookmarkOutputSchema,
  displayName: 'Update Bookmark',
  description: 'Updates the fields you set on an existing bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on one bookmark (ID from List Bookmarks): URL, title, excerpt, note, cover, collection, tags or favourite flag. Tags replace the existing list; set Clear Tags to remove them all. Use Update Bookmarks to change many bookmarks at once.',
    idempotent: true,
  },
  props: {
    raindropId: raindropAiProps.raindropId({ required: true }),
    link: Property.ShortText({
      displayName: 'URL',
      description: 'New URL for the bookmark.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: 'New short description of the page.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'New personal note.',
      required: false,
    }),
    cover: Property.ShortText({
      displayName: 'Cover URL',
      description:
        'New cover image URL. Use Upload Bookmark Cover to upload an image file instead.',
      required: false,
    }),
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID to move the bookmark into, from List Collections. -1 = Unsorted, -99 = Trash.',
    }),
    tags: raindropAiProps.tags({
      required: false,
      description: 'Tag names that replace the current tags, e.g. ["reading", "ai"].',
    }),
    clearTags: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Clear Tags',
      description: 'Remove all tags from the bookmark. Cannot be combined with Tags.',
    }),
    important: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Favourite',
      description: 'Mark or unmark the bookmark as a favourite.',
    }),
    order: Property.Number({
      displayName: 'Order',
      description: 'Sort position in its collection, ascending; 0 moves it to the top.',
      required: false,
    }),
    pleaseParse: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Re-parse Metadata',
      description: 'Re-read cover, type and content from the URL in the background.',
    }),
  },
  async run({ auth, propsValue }) {
    const tags = raindropUtils.toStringList({ value: propsValue.tags });
    const clearTags = raindropUtils.toBoolean({ value: propsValue.clearTags }) === true;
    if (clearTags && tags.length > 0) {
      throw new Error('Set either Tags or Clear Tags, not both.');
    }
    const body: Record<string, unknown> = {
      ...(propsValue.link !== undefined ? { link: propsValue.link } : {}),
      ...(propsValue.title !== undefined ? { title: propsValue.title } : {}),
      ...(propsValue.excerpt !== undefined ? { excerpt: propsValue.excerpt } : {}),
      ...(propsValue.note !== undefined ? { note: propsValue.note } : {}),
      ...(propsValue.cover !== undefined ? { cover: propsValue.cover } : {}),
      ...(propsValue.collectionId !== undefined
        ? { collection: { $id: propsValue.collectionId } }
        : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(clearTags ? { tags: [] } : {}),
      ...(propsValue.important !== undefined
        ? { important: raindropUtils.toBoolean({ value: propsValue.important }) }
        : {}),
      ...(propsValue.order !== undefined ? { order: propsValue.order } : {}),
      ...(raindropUtils.toBoolean({ value: propsValue.pleaseParse }) === true
        ? { pleaseParse: {} }
        : {}),
    };
    return await raindropClient.request<RaindropUpdateBookmarkResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
      body,
    });
  },
});

type RaindropUpdateBookmarkResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
