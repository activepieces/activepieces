import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { searchWorkspaceOutputSchema } from '../output-schemas';

export const searchWorkspaceAction = createAction({
  name: 'baserow_search_workspace',
  classification: 'SEARCH',
  outputSchema: searchWorkspaceOutputSchema,
  displayName: 'Search Workspace',
  description: 'Searches databases, tables, fields and rows in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs Baserow\'s workspace-wide search across databases, tables, fields and row content, returning matches with their type and IDs. Use when you do not know which table holds a record; within a known table use List Rows with Search. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    workspace_id: baserowAiProps.workspaceIdProp(),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum results to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, query, limit, offset } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Search Workspace' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() =>
      client.searchWorkspace({
        workspaceId: workspace_id,
        query,
        limit: limit ?? undefined,
        offset: offset ?? undefined,
      })
    );
  },
});
