import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { filterOutputSchema } from '../output-schemas';

export const getFilter = createAction({
  auth: mastodonAuth,
  name: 'get_filter',
  classification: 'READ',
  displayName: 'Get Filter',
  description: 'Get one of your content filters by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one of the connected account\'s content filters by ID, with its keywords, contexts and action. Use List Filters to find IDs. Requires Mastodon 4.0 or later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: filterOutputSchema,
  props: {
    filter_id: Property.ShortText({
      displayName: 'Filter ID',
      description:
        'ID of the filter. Obtain it from List Filters or Create Filter.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v2/filters/${encodeURIComponent(context.propsValue.filter_id)}`,
      operation: 'Get Filter',
      scope: 'read:filters',
      minVersion: '4.0.0',
    });
  },
});
