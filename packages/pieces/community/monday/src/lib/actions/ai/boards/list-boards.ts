import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { listBoardsActionOutputSchema } from '../../../output-schemas';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const listBoardsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_boards',
  classification: 'SEARCH',
  displayName: 'List Boards',
  description: 'Lists boards, optionally filtered by workspace, IDs or state.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com boards the connected user can access, with their workspace, folder, owners and item count. Use to resolve a board name to the board ID that every item, column and group action needs. Filter by workspace IDs or board IDs; paginate with page and limit. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listBoardsActionOutputSchema,
  props: {
    workspace_ids: Property.Array({
      displayName: 'Workspace IDs',
      description: 'Only return boards in these workspaces. Resolve them with List Workspaces.',
      required: false,
    }),
    board_ids: Property.Array({
      displayName: 'Board IDs',
      description: 'Only return these boards.',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Archived', value: 'archived' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    board_kind: Property.StaticDropdown({
      displayName: 'Board Kind',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Shareable', value: 'share' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Boards per page (default 50).',
      required: false,
      defaultValue: 50,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { state, board_kind, limit, page } = context.propsValue;
    const workspaceIds = mondayApi.toStringArray(context.propsValue.workspace_ids);
    const boardIds = mondayApi.toStringArray(context.propsValue.board_ids);

    const data = await makeClient(context.auth).query<{ boards: MondayBoard[] }>({
      query: `query ($ids: [ID!], $workspace_ids: [ID], $state: State, $board_kind: BoardKind, $limit: Int, $page: Int) {
        boards(ids: $ids, workspace_ids: $workspace_ids, state: $state, board_kind: $board_kind, limit: $limit, page: $page) {
          id
          name
          description
          state
          board_kind
          url
          workspace_id
          board_folder_id
          items_count
          updated_at
          owners { id name }
        }
      }`,
      variables: {
        ids: boardIds.length > 0 ? boardIds : undefined,
        workspace_ids: workspaceIds.length > 0 ? workspaceIds : undefined,
        state: state ?? 'active',
        board_kind: board_kind ?? undefined,
        limit: limit ?? 50,
        page: page ?? 1,
      },
    });

    const boards = data.boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description ?? null,
      state: board.state,
      board_kind: board.board_kind,
      url: board.url,
      workspace_id: board.workspace_id ?? null,
      folder_id: board.board_folder_id ?? null,
      items_count: board.items_count ?? null,
      updated_at: board.updated_at ?? null,
      owner_ids: board.owners.map((owner) => owner.id).join(', '),
      owner_names: board.owners.map((owner) => owner.name).join(', '),
    }));

    return { boards, count: boards.length };
  },
});

type MondayBoard = {
  id: string;
  name: string;
  description: string | null;
  state: string;
  board_kind: string;
  url: string;
  workspace_id: string | null;
  board_folder_id: string | null;
  items_count: number | null;
  updated_at: string | null;
  owners: { id: string; name: string }[];
};
