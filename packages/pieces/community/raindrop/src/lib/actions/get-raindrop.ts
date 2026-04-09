import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropCommons } from '../common';

export const getRaindropAction = createAction({
  auth: raindropAuth,
  name: 'get_raindrop',
  displayName: 'Get Bookmark',
  description: 'Retrieves the details of a bookmark by its ID',
  props: {
    raindrop_id: Property.ShortText({
      displayName: 'Bookmark ID',
      description:
        'The numeric ID of the bookmark. You can find it in the URL when viewing the bookmark in Raindrop.io (e.g. raindrop.io/app/raindrop/123456789).',
      required: true,
    }),
  },
  async run(context) {
    const { raindrop_id } = context.propsValue;
    const accessToken = (context.auth as OAuth2PropertyValue).access_token;

    const response = await httpClient.sendRequest<{ item: RaindropApiResponse }>({
      method: HttpMethod.GET,
      url: `${raindropCommons.BASE_URL}/raindrop/${raindrop_id}`,
      headers: { Authorization: `Bearer ${accessToken}` },
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
