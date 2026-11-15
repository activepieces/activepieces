import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const listFavourites = createAction({
  auth: mastodonAuth,
  name: 'list_favourites',
  classification: 'SEARCH',
  displayName: 'List Favourites',
  description: 'List the statuses you have favourited.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of statuses favourited by the connected account, newest favourite first, with Link-header cursors for further pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/favourites',
      operation: 'List Favourites',
      scope: 'read:favourites',
      query: { limit, max_id, since_id, min_id },
    });
    return { statuses: items, ...cursors };
  },
});
