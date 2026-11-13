import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropClient } from '../common/client';
import { raindropProps } from '../common/props';
import type { RaindropItem } from '../common/types';
import { raindropUtils } from '../common/utils';
import { getRaindropOutputSchema } from '../output-schemas';

export const createRaindropAction = createAction({
  auth: raindropAuth,
  name: 'create_raindrop',
  outputSchema: getRaindropOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Bookmark',
  description: 'Saves a new bookmark to your Raindrop.io account',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new bookmark (raindrop) in Raindrop.io from a URL, optionally setting title, excerpt, note, tags, target collection, and favourite flag. Use to save a web page to a user\'s account. The URL is required; if no title is given Raindrop auto-extracts it from the page. Not idempotent: each call adds another bookmark, even for a URL already saved.',
    idempotent: false,
  },
  props: {
    link: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the page to bookmark',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description:
        'Custom title for the bookmark. If left empty, Raindrop will extract it from the URL automatically.',
      required: false,
    }),
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: 'Short description or summary of the page',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Personal note to attach to this bookmark',
      required: false,
    }),
    collection_id: raindropProps.collectionId({ required: false }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'List of tags to organize the bookmark (press Enter to add each tag)',
      required: false,
    }),
    important: Property.Checkbox({
      displayName: 'Mark as Favourite',
      description: 'Mark this bookmark as important / favourite',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { link, title, excerpt, note, collection_id, tags, important } =
      context.propsValue;

    const body: Record<string, unknown> = {
      link,
      pleaseParse: {},
    };
    if (title) body['title'] = title;
    if (excerpt) body['excerpt'] = excerpt;
    if (note) body['note'] = note;
    if (collection_id !== null && collection_id !== undefined) {
      body['collection'] = { $id: collection_id };
    }
    if (tags && tags.length > 0) body['tags'] = tags;
    if (important) body['important'] = important;

    const response = await raindropClient.request<{ item: RaindropItem }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/raindrop',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return raindropUtils.flattenRaindrop({ raindrop: response.item });
  },
});
