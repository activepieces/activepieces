import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { createBoardActionOutputSchema } from '../../../output-schemas';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const createBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_board',
  classification: 'WRITE',
  displayName: 'Create Board',
  description: 'Creates a new board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new monday.com board, optionally inside a workspace and folder or from a template. Use to start a new board; to copy an existing board with its structure or items use Duplicate Board instead. Each call creates another board, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createBoardActionOutputSchema,
  props: {
    board_name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
    }),
    board_kind: Property.StaticDropdown({
      displayName: 'Board Kind',
      description: 'Who can see the board.',
      required: true,
      defaultValue: 'public',
      options: {
        options: [
          { label: 'Public (main)', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Shareable', value: 'share' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Workspace to create the board in. Resolve it with List Workspaces. Omit for the main workspace.',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Folder to place the board in; must belong to the workspace. Resolve it with List Folders.',
      required: false,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Board or template ID to create the board from.',
      required: false,
    }),
    board_owner_ids: Property.Array({
      displayName: 'Owner User IDs',
      description: 'Users to add as board owners. Resolve them with List Users.',
      required: false,
    }),
    board_subscriber_ids: Property.Array({
      displayName: 'Subscriber User IDs',
      description: 'Users to add as board subscribers. Resolve them with List Users.',
      required: false,
    }),
  },
  async run(context) {
    const { board_name, board_kind, description, workspace_id, folder_id, template_id } = context.propsValue;
    const ownerIds = mondayApi.toStringArray(context.propsValue.board_owner_ids);
    const subscriberIds = mondayApi.toStringArray(context.propsValue.board_subscriber_ids);

    const data = await makeClient(context.auth).query<{ create_board: MondayBoard }>({
      query: `mutation ($board_name: String!, $board_kind: BoardKind!, $description: String, $workspace_id: ID, $folder_id: ID, $template_id: ID, $board_owner_ids: [ID!], $board_subscriber_ids: [ID!]) {
        create_board(board_name: $board_name, board_kind: $board_kind, description: $description, workspace_id: $workspace_id, folder_id: $folder_id, template_id: $template_id, board_owner_ids: $board_owner_ids, board_subscriber_ids: $board_subscriber_ids) {
          id
          name
          description
          state
          board_kind
          url
          workspace_id
          board_folder_id
        }
      }`,
      variables: {
        board_name,
        board_kind,
        description: description || undefined,
        workspace_id: workspace_id || undefined,
        folder_id: folder_id || undefined,
        template_id: template_id || undefined,
        board_owner_ids: ownerIds.length > 0 ? ownerIds : undefined,
        board_subscriber_ids: subscriberIds.length > 0 ? subscriberIds : undefined,
      },
    });

    const board = data.create_board;
    return {
      id: board.id,
      name: board.name,
      description: board.description ?? null,
      state: board.state,
      board_kind: board.board_kind,
      url: board.url,
      workspace_id: board.workspace_id ?? null,
      folder_id: board.board_folder_id ?? null,
    };
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
};
