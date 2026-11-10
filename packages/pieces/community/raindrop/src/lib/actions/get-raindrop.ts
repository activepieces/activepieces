import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { raindropAuth } from '../auth';
import { raindropClient } from '../common/client';
import type { RaindropItem } from '../common/types';
import { raindropUtils } from '../common/utils';
import { getRaindropOutputSchema } from '../output-schemas';

export const getRaindropAction = createAction({
  auth: raindropAuth,
  name: 'get_raindrop',
  outputSchema: getRaindropOutputSchema,
  classification: 'READ',
  displayName: 'Get Bookmark',
  description: 'Retrieves the details of a bookmark by its ID',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a single Raindrop.io bookmark by its numeric ID. Use when you already have a bookmark ID and need its full details (title, link, tags, collection, etc.); to locate bookmarks by keyword or collection instead, use Find Bookmarks. Read-only and idempotent.',
    idempotent: true,
  },
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

    const response = await raindropClient.request<{ item: RaindropItem }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/raindrop/${raindrop_id}`,
    });

    return raindropUtils.flattenRaindrop({ raindrop: response.item });
  },
});
