import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const updateRaindropAction = createAction({
  auth: raindropAuth,
  name: 'update_raindrop',
  displayName: 'Update Bookmark',
  description: 'Updates the details of an existing bookmark',
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
    collection_id: raindropCommons.collectionDropdown,
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
    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const body: Record<string, unknown> = {};
    if (title !== undefined && title !== null) body['title'] = title;
    if (excerpt !== undefined && excerpt !== null) body['excerpt'] = excerpt;
    if (note !== undefined && note !== null) body['note'] = note;
    if (collection_id !== null && collection_id !== undefined) {
      body['collection'] = { $id: collection_id };
    }
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (important !== undefined && important !== null) body['important'] = important;

    const response = await httpClient.sendRequest<{ item: RaindropApiResponse }>({
      method: HttpMethod.PUT,
      url: `${raindropCommons.BASE_URL}/raindrop/${raindrop_id}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return flattenResponse(response.body.item);
  },
});

function flattenResponse(item: RaindropApiResponse) {
  return {
    id: item._id,
    title: item.title ?? null,
    excerpt: item.excerpt ?? null,
    note: item.note ?? null,
    link: item.link ?? null,
    type: item.type ?? null,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : null,
    important: item.important ?? false,
    collection_id: item.collection?.$id ?? null,
    cover: item.cover ?? null,
    created_at: item.created ?? null,
    updated_at: item.lastUpdate ?? null,
  };
}

type RaindropApiResponse = {
  _id: number;
  title?: string;
  excerpt?: string;
  note?: string;
  link?: string;
  type?: string;
  tags?: string[];
  important?: boolean;
  collection?: { $id: number };
  cover?: string;
  created?: string;
  lastUpdate?: string;
};
