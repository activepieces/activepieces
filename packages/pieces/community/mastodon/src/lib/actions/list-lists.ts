import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { listsOutputSchema } from '../output-schemas';

export const listLists = createAction({
  auth: mastodonAuth,
  name: 'list_lists',
  classification: 'SEARCH',
  displayName: 'List Lists',
  description: 'List all of your lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns all lists owned by the connected account with their IDs, titles and settings; use it to resolve a list name to the List ID other list actions need. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listsOutputSchema,
  props: {},
  async run(context) {
    const lists = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/lists',
      operation: 'List Lists',
      scope: 'read:lists',
    });
    return { lists, count: lists.length };
  },
});
