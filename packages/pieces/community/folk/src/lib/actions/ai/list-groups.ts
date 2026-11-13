import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const listGroups = createAction({
  auth: folkAuth,
  name: 'list_groups',
  displayName: 'List Groups',
  description: 'List the groups in the Folk workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.groups,
  aiMetadata: {
    description:
      'Lists Folk groups (id grp_..., name, visibility) one page at a time with hasMore and nextCursor. Use the IDs for Group IDs, Custom Field Values, List Group Custom Fields and group objects such as deals. Read-only.',
    idempotent: true,
  },
  props: {
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/groups',
      ...folkAi.paging({ propsValue: context.propsValue }),
    });
    return folkAi.pageResult({ page });
  },
});
