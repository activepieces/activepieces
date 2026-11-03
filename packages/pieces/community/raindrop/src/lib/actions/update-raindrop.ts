import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropClient } from '../common/client';
import { raindropProps } from '../common/props';
import type { RaindropItem } from '../common/types';
import { raindropUtils } from '../common/utils';
import { updateRaindropOutputSchema } from '../output-schemas';

export const updateRaindropAction = createAction({
  auth: raindropAuth,
  name: 'update_raindrop',
  outputSchema: updateRaindropOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Bookmark',
  description: 'Updates the details of an existing bookmark',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing Raindrop.io bookmark identified by its numeric ID, changing any of title, excerpt, note, tags, collection, or favourite flag. Only supplied fields are changed; supplying tags replaces the existing tag list. Idempotent: repeating the same update yields the same final state.',
    idempotent: true,
  },
  props: {
    raindrop_id: Property.ShortText({
      displayName: 'Bookmark ID',
      description:
        'The numeric ID of the bookmark to update. You can find it in the URL when viewing the bookmark in Raindrop.io (e.g. raindrop.io/app/raindrop/123456789).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'New Title',
      description: 'Updated title for the bookmark',
      required: false,
    }),
    excerpt: Property.LongText({
      displayName: 'New Excerpt',
      description: 'Updated short description or summary of the page',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'New Note',
      description: 'Updated personal note attached to the bookmark',
      required: false,
    }),
    collection_id: raindropProps.collectionId({ required: false }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'New list of tags (replaces existing tags). Leave empty to keep existing tags unchanged.',
      required: false,
    }),
    important: Property.Checkbox({
      displayName: 'Mark as Favourite',
      description: 'Mark or unmark this bookmark as important / favourite',
      required: false,
    }),
  },
  async run(context) {
    const { raindrop_id, title, excerpt, note, collection_id, tags, important } =
      context.propsValue;

    const body: Record<string, unknown> = {};
    if (title !== undefined && title !== null) body['title'] = title;
    if (excerpt !== undefined && excerpt !== null) body['excerpt'] = excerpt;
    if (note !== undefined && note !== null) body['note'] = note;
    if (collection_id !== null && collection_id !== undefined) {
      body['collection'] = { $id: collection_id };
    }
    if (tags && tags.length > 0) body['tags'] = tags;
    if (important !== undefined && important !== null) body['important'] = important;

    const response = await raindropClient.request<{ item: RaindropItem }>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${raindrop_id}`,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return raindropUtils.flattenRaindrop({ raindrop: response.item });
  },
});
