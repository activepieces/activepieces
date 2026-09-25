import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { filtersOutputSchema } from '../output-schemas';

export const listFilters = createAction({
  auth: mastodonAuth,
  name: 'list_filters',
  classification: 'SEARCH',
  displayName: 'List Filters',
  description: 'List all of your content filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns all content filters of the connected account with their keywords, contexts and actions. Requires Mastodon 4.0 or later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: filtersOutputSchema,
  props: {},
  async run(context) {
    const filters = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v2/filters',
      operation: 'List Filters',
      scope: 'read:filters',
      minVersion: '4.0.0',
    });
    return { filters, count: filters.length };
  },
});
