import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { deletedFilterOutputSchema } from '../output-schemas';

export const deleteFilter = createAction({
  auth: mastodonAuth,
  name: 'delete_filter',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Filter',
  description: 'Delete one of your content filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one of the connected account\'s content filters with all its keywords. Requires Mastodon 4.0 or later. Irreversible; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: deletedFilterOutputSchema,
  props: {
    filter_id: Property.ShortText({
      displayName: 'Filter ID',
      description:
        'ID of the filter. Obtain it from List Filters or Create Filter.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v2/filters/${encodeURIComponent(context.propsValue.filter_id)}`,
      operation: 'Delete Filter',
      scope: 'write:filters',
      minVersion: '4.0.0',
    });
    return { success: true, filter_id: context.propsValue.filter_id };
  },
});
