import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropGetFiltersOutputSchema } from '../../../output-schemas';

export const raindropGetFiltersAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_filters',
  outputSchema: raindropGetFiltersOutputSchema,
  displayName: 'Get Filters',
  description: 'Gets tag, type, favourite, broken and duplicate counts for a collection.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns bookmark counts for a collection (or all bookmarks): per tag, per type (article, image, video, ...), favourites, untagged, broken links and duplicates, optionally narrowed by a search query. Use List Tags when only tag names are needed.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: false,
      description: 'Collection ID from List Collections. Defaults to 0 (all bookmarks).',
    }),
    tagsSort: Property.StaticDropdown({
      displayName: 'Sort Tags By',
      description: 'Order of the tags list. Defaults to count.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Count (highest first)', value: '-count' },
          { label: 'Name', value: '_id' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'Raindrop search query to count only matching bookmarks, e.g. "#reading" or "apple".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropGetFiltersResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/filters/${encodeURIComponent(propsValue.collectionId ?? '0')}`,
      query: {
        ...(propsValue.tagsSort !== undefined ? { tagsSort: propsValue.tagsSort } : {}),
        ...(propsValue.search !== undefined ? { search: propsValue.search } : {}),
      },
    });
  },
});

type RaindropGetFiltersResponse = {
  result: boolean;
  broken: { count: number };
  duplicates: { count: number };
  important: { count: number };
  notag: { count: number };
  tags: { _id: string; count: number }[];
  types: { _id: string; count: number }[];
};
