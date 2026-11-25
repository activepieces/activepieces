import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const listUsers = createAction({
  auth: folkAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List the members of the Folk workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.users,
  aiMetadata: {
    description: 'Lists Folk workspace users (id usr_..., full name, email) one page at a time with hasMore and nextCursor; use the IDs or emails as task assignees. Read-only.',
    idempotent: true,
  },
  props: {
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/users',
      ...folkAi.paging({ propsValue: context.propsValue }),
    });
    return folkAi.pageResult({ page });
  },
});
