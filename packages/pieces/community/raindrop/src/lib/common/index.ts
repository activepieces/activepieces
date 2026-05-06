import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';

const BASE_URL = 'https://api.raindrop.io/rest/v1';

const collectionDropdown = Property.Dropdown({
  displayName: 'Collection',
  description:
    'Select the collection to use. Leave empty to use "Unsorted" (default inbox).',
  refreshers: [],
  required: false,
  auth: raindropAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    const accessToken = (auth as OAuth2PropertyValue).access_token;
    try {
      const [rootResp, childResp] = await Promise.all([
        httpClient.sendRequest<{ items: CollectionItem[] }>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/collections`,
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        httpClient.sendRequest<{ items: CollectionItem[] }>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/collections/childrens`,
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      const allCollections = [
        ...rootResp.body.items,
        ...childResp.body.items,
      ];
      return {
        disabled: false,
        options: [
          { label: 'Unsorted', value: -1 },
          ...allCollections.map((c) => ({ label: c.title, value: c._id })),
        ],
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load collections. Check your connection.',
      };
    }
  },
});

export const raindropCommons = {
  BASE_URL,
  collectionDropdown,
  flattenRaindrop,
};

function flattenRaindrop({
  raindrop,
}: {
  raindrop: RaindropApiItem;
}): FlatRaindrop {
  return {
    id: raindrop._id,
    title: raindrop.title ?? null,
    excerpt: raindrop.excerpt ?? null,
    note: raindrop.note ?? null,
    link: raindrop.link ?? null,
    type: raindrop.type ?? null,
    tags: Array.isArray(raindrop.tags) ? raindrop.tags.join(', ') : null,
    important: raindrop.important ?? false,
    collection_id: raindrop.collection?.$id ?? null,
    cover: raindrop.cover ?? null,
    created_at: raindrop.created ?? null,
    updated_at: raindrop.lastUpdate ?? null,
  };
}

type CollectionItem = {
  _id: number;
  title: string;
};

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

type FlatRaindrop = {
  id: number;
  title: string | null;
  excerpt: string | null;
  note: string | null;
  link: string | null;
  type: string | null;
  tags: string | null;
  important: boolean;
  collection_id: number | null;
  cover: string | null;
  created_at: string | null;
  updated_at: string | null;
};
