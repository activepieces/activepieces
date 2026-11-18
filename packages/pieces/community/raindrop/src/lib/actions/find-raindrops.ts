import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropClient } from '../common/client';
import { raindropProps } from '../common/props';
import type { RaindropItem } from '../common/types';
import { raindropUtils } from '../common/utils';
import { findRaindropsOutputSchema } from '../output-schemas';

export const findRaindropsAction = createAction({
  auth: raindropAuth,
  name: 'find_raindrops',
  outputSchema: findRaindropsOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Bookmarks',
  description: 'Lists bookmarks from a collection, with optional keyword search',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists bookmarks from a Raindrop.io collection, sorted newest-first. Operates in two modes: with an empty search it returns all bookmarks in the collection, and with a search query it filters by keyword (supporting operators like #tag or type:article). Defaults to a collection covering all bookmarks when none is chosen; returns up to 50 per call. Use to discover bookmark IDs or browse saved content. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    collection_id: raindropProps.collectionId({ required: false }),
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

    const collectionIdToUse = collection_id ?? 0;
    const perpage = Math.min(limit ?? 25, 50);

    const queryParams: Record<string, string> = {
      sort: '-created',
      perpage: String(perpage),
      page: '0',
    };
    if (search) queryParams['search'] = search;

    const response = await raindropClient.request<{ items: RaindropItem[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/raindrops/${collectionIdToUse}`,
      query: queryParams,
    });

    return response.items.map((item) =>
      raindropUtils.flattenRaindrop({ raindrop: item })
    );
  },
});
