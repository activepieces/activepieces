import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropCreateBookmarkOutputSchema } from '../../../output-schemas';

export const raindropCreateBookmarkAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_create_bookmark',
  outputSchema: raindropCreateBookmarkOutputSchema,
  displayName: 'Create Bookmark',
  description: 'Saves a new bookmark (raindrop) from a URL.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves a URL as a new Raindrop.io bookmark, optionally with title, excerpt, note, tags, collection and favourite flag. Missing title, excerpt and cover are parsed from the page in the background. Not idempotent: each call adds another bookmark, even for a URL already saved (use Check URLs Exist first to avoid duplicates).',
    idempotent: false,
  },
  props: {
    link: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to bookmark, e.g. "https://example.com/article".',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Bookmark title. Parsed from the page when omitted.',
      required: false,
    }),
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: 'Short description of the page.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Personal note on the bookmark.',
      required: false,
    }),
    collectionId: raindropAiProps.collectionId({
      required: false,
      description: 'Collection ID to save into, from List Collections. Defaults to Unsorted (-1).',
    }),
    tags: raindropAiProps.tags({ required: false }),
    important: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Favourite',
      description: 'Mark the bookmark as a favourite.',
    }),
  },
  async run({ auth, propsValue }) {
    const tags = raindropUtils.toStringList({ value: propsValue.tags });
    return await raindropClient.request<RaindropCreateBookmarkResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/raindrop',
      body: {
        link: propsValue.link,
        title: propsValue.title,
        excerpt: propsValue.excerpt,
        note: propsValue.note,
        collection:
          propsValue.collectionId !== undefined ? { $id: propsValue.collectionId } : undefined,
        tags: tags.length > 0 ? tags : undefined,
        important: raindropUtils.toBoolean({ value: propsValue.important }),
        pleaseParse: {},
      },
    });
  },
});

type RaindropCreateBookmarkResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
