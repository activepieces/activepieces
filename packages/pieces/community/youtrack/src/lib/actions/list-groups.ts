import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from '../common';
import { youtrackClient } from '../common/client';
import { listGroupsActionOutputSchema } from '../output-schemas';

export const listGroupsAction = createAction({
  auth: youtrackAuth,
  name: 'list_groups',
  classification: 'SEARCH',
  outputSchema: listGroupsActionOutputSchema,
  displayName: 'List Groups',
  description: 'Lists the user groups in YouTrack.',
  audience: 'both',
  aiMetadata: {
    description:
      'List YouTrack user groups with ID, name and member count. Use the group ID for Visible to Group in Add Comment. Returns items plus hasMore; use Skip for the next page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', description: `Max groups to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of groups to skip. Default 0.', required: false }),
  },
  async run(context) {
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: '/groups',
      query: { fields: 'id,name,usersCount' },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'list groups',
    });
    return {
      items: items.map((g) => ({ id: g['id'] ?? null, name: g['name'] ?? null, usersCount: g['usersCount'] ?? null })),
      hasMore,
    };
  },
});
