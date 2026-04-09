import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const createRaindropAction = createAction({
  auth: raindropAuth,
  name: 'create_raindrop',
  displayName: 'Create Bookmark',
  description: 'Saves a new bookmark to your Raindrop.io account',
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
    collection_id: raindropCommons.collectionDropdown,
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
    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

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
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (important) body['important'] = important;

    const response = await httpClient.sendRequest<{ item: RaindropApiResponse }>({
      method: HttpMethod.POST,
      url: `${raindropCommons.BASE_URL}/raindrop`,
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
