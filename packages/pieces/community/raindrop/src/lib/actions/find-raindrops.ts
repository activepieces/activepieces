import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const findRaindropsAction = createAction({
  auth: raindropAuth,
  name: 'find_raindrops',
  displayName: 'Find Bookmarks',
  description: 'Lists bookmarks from a collection, with optional keyword search',
  props: {
    collection_id: raindropCommons.collectionDropdown,
    search: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Filter bookmarks by keyword. Supports operators like #tag or type:article. Leave empty to list all bookmarks.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of bookmarks to return (max 50)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { collection_id, search, limit } = context.propsValue;
    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const collectionIdToUse = collection_id ?? 0;
    const perpage = Math.min(limit ?? 25, 50);

    const queryParams: Record<string, string> = {
      sort: '-created',
      perpage: String(perpage),
      page: '0',
    };
    if (search) queryParams['search'] = search;

    const response = await httpClient.sendRequest<{ items: RaindropApiItem[] }>({
      method: HttpMethod.GET,
      url: `${raindropCommons.BASE_URL}/raindrops/${collectionIdToUse}`,
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
    });

    return response.body.items.map((item) => ({
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
    }));
  },
});

type RaindropApiItem = {
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
