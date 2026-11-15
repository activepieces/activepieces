import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { youtrackClient } from '../common/client';
import { listTagsActionOutputSchema } from '../output-schemas';

export const listTagsAction = createAction({
  auth: youtrackAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  outputSchema: listTagsActionOutputSchema,
  displayName: 'List Tags',
  description: 'Lists all tags visible to the current user.',
  audience: 'both',
  aiMetadata: {
    description:
      'List tags visible to the current user, optionally filtered by a name substring; leave the filter empty to return all tags (up to Limit, default 100). Use to discover tag IDs before Add Tag to Issue or Remove Tag from Issue. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Filter by Name', description: 'Filter tags by name. Leave empty for all.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Max tags. Default 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const items = await youtrackClient.listUpTo({
      auth: context.auth,
      path: '/tags',
      query: {
        fields: 'id,name,owner(id,name),visibleFor(id,name),updateableBy(id,name),untagOnResolve',
        query: youtrackClient.optionalText(context.propsValue.query),
      },
      limit: context.propsValue.limit,
      fallback: 100,
      operation: 'list tags',
    });
    return items.map((tag) => {
      const owner = youtrackClient.recordOf(tag['owner']);
      return {
        id: tag['id'],
        name: tag['name'],
        owner_name: owner['name'] ?? null,
        owner_id: owner['id'] ?? null,
        visible_for_name: youtrackClient.recordOf(tag['visibleFor'])['name'] ?? 'Only me',
        updateable_by_name: youtrackClient.recordOf(tag['updateableBy'])['name'] ?? 'Only me',
        untag_on_resolve: tag['untagOnResolve'] ?? false,
      };
    });
  },
});
