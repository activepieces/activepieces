// Action: List Tags
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { youtrackApiCall } from '../common';

export const listTagsAction = createAction({
  auth: youtrackAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'Lists all tags visible to the current user.',
  props: {
    query: Property.ShortText({ displayName: 'Filter by Name', description: 'Filter tags by name. Leave empty for all.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Max tags. Default 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const limit = context.propsValue.limit ?? 100;
    const queryParams: Record<string, string> = {
      fields: 'id,name,owner(id,name),visibleFor(id,name),updateableBy(id,name),untagOnResolve',
      '$top': String(limit),
    };
    if (context.propsValue.query) queryParams['query'] = context.propsValue.query;
    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/tags',
      queryParams,
    });
    const data = response.body;
    return (data || []).map((tag) => ({
      id: tag['id'], name: tag['name'],
      owner_name: (tag['owner'] as Record<string, unknown>)?.['name'] ?? null,
      owner_id: (tag['owner'] as Record<string, unknown>)?.['id'] ?? null,
      visible_for_name: (tag['visibleFor'] as Record<string, unknown>)?.['name'] ?? 'Only me',
      updateable_by_name: (tag['updateableBy'] as Record<string, unknown>)?.['name'] ?? 'Only me',
      untag_on_resolve: tag['untagOnResolve'] ?? false,
    }));
  },
});
