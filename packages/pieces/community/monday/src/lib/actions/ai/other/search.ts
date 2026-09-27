import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { searchActionOutputSchema } from '../../../output-schemas';

export const searchAction = createAction({
  auth: mondayAuth,
  name: 'monday_search',
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Searches items, boards, docs or workspaces across the account by keyword.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search the whole monday.com account by free-text query (keyword plus semantic matching) for items, boards, docs or workspaces and get back IDs, names and URLs ranked by relevance (max 20). Use when you know roughly what something is called but not its ID; to filter items on a known board by exact column values use Search Items by Column Values. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchActionOutputSchema,
  props: {
    entity_type: Property.StaticDropdown({
      displayName: 'Search For',
      required: true,
      defaultValue: 'items',
      options: {
        options: [
          { label: 'Items', value: 'items' },
          { label: 'Boards', value: 'boards' },
          { label: 'Docs', value: 'docs' },
          { label: 'Workspaces', value: 'workspaces' },
        ],
      },
    }),
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum results (default 10, max 20).',
      required: false,
    }),
    board_ids: Property.Array({
      displayName: 'Board IDs',
      description: 'Items and boards only: restrict to these boards.',
      required: false,
    }),
    workspace_ids: Property.Array({
      displayName: 'Workspace IDs',
      description: 'Items, boards and docs only: restrict to these workspaces.',
      required: false,
    }),
  },
  async run(context) {
    const { entity_type, query, limit } = context.propsValue;
    if (limit !== undefined && limit !== null && (limit < 1 || limit > 20)) {
      throw new Error('Limit must be between 1 and 20.');
    }
    const boardIds = mondayApi.toStringArray(context.propsValue.board_ids);
    const workspaceIds = mondayApi.toStringArray(context.propsValue.workspace_ids);
    const spec = SEARCH_SPECS[entity_type];
    if (!spec) {
      throw new Error(`Unsupported entity type: ${entity_type}`);
    }

    const data = await makeClient(context.auth).query<{ search: Record<string, { results: SearchResult[] | null } | null> | null }>({
      query: `query (${spec.variableDefs}) {
        search {
          ${entity_type}(${spec.args}) {
            results {
              id
              indexed_data { ${spec.fields} }
            }
          }
        }
      }`,
      variables: {
        query,
        limit: limit ?? undefined,
        ...(spec.supportsBoards && boardIds.length > 0 ? { board_ids: boardIds } : {}),
        ...(spec.supportsWorkspaces && workspaceIds.length > 0 ? { workspace_ids: workspaceIds } : {}),
      },
    });

    const results = (data.search?.[entity_type]?.results ?? []).map((result) => {
      const indexed = result.indexed_data ?? {};
      return {
        id: result.id,
        entity_type,
        name: toNullableString(indexed['name']),
        url: toNullableString(indexed['url']),
        board_id: toNullableString(indexed['board_id']),
        workspace_id: toNullableString(indexed['workspace_id']),
        description: toNullableString(indexed['description']),
      };
    });

    return { results, count: results.length };
  },
});

function toNullableString(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

const SEARCH_SPECS: Record<string, SearchSpec> = {
  items: {
    variableDefs: '$query: String!, $limit: Int, $board_ids: [ID!], $workspace_ids: [ID!]',
    args: 'query: $query, limit: $limit, board_ids: $board_ids, workspace_ids: $workspace_ids',
    fields: 'name url board_id workspace_id',
    supportsBoards: true,
    supportsWorkspaces: true,
  },
  boards: {
    variableDefs: '$query: String!, $limit: Int, $board_ids: [ID!], $workspace_ids: [ID!]',
    args: 'query: $query, limit: $limit, board_ids: $board_ids, workspace_ids: $workspace_ids',
    fields: 'name url description workspace_id',
    supportsBoards: true,
    supportsWorkspaces: true,
  },
  docs: {
    variableDefs: '$query: String!, $limit: Int, $workspace_ids: [ID!]',
    args: 'query: $query, limit: $limit, workspace_ids: $workspace_ids',
    fields: 'name workspace_id',
    supportsBoards: false,
    supportsWorkspaces: true,
  },
  workspaces: {
    variableDefs: '$query: String!, $limit: Int',
    args: 'query: $query, limit: $limit',
    fields: 'name description',
    supportsBoards: false,
    supportsWorkspaces: false,
  },
};

type SearchSpec = {
  variableDefs: string;
  args: string;
  fields: string;
  supportsBoards: boolean;
  supportsWorkspaces: boolean;
};

type SearchResult = {
  id: string;
  indexed_data: Record<string, unknown> | null;
};
