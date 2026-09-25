import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { duplicateBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const duplicateBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_duplicate_board',
  classification: 'WRITE',
  displayName: 'Duplicate Board',
  description: 'Duplicates a board with its structure and optionally its items and updates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copy an existing monday.com board: structure only, structure plus items, or structure plus items and updates. Use to clone a template-like board; to start from scratch use Create Board. Large boards are duplicated asynchronously, so items may appear shortly after the call returns. Each call creates another board.',
    idempotent: false,
  },
  outputSchema: duplicateBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    duplicate_type: Property.StaticDropdown({
      displayName: 'What to Copy',
      required: true,
      defaultValue: 'duplicate_board_with_structure',
      options: {
        options: [
          { label: 'Structure only', value: 'duplicate_board_with_structure' },
          { label: 'Structure and items', value: 'duplicate_board_with_pulses' },
          { label: 'Structure, items and updates', value: 'duplicate_board_with_pulses_and_updates' },
        ],
      },
    }),
    board_name: Property.ShortText({
      displayName: 'New Board Name',
      description: 'Defaults to "Duplicate of <original name>".',
      required: false,
    }),
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Destination workspace. Defaults to the original board’s workspace.',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Destination folder. Defaults to the original board’s folder.',
      required: false,
    }),
    keep_subscribers: Property.Checkbox({
      displayName: 'Keep Subscribers',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { board_id, duplicate_type, board_name, workspace_id, folder_id, keep_subscribers } = context.propsValue;

    const data = await makeClient(context.auth).query<{
      duplicate_board: { board: { id: string; name: string; url: string; workspace_id: string | null } };
    }>({
      query: `mutation ($board_id: ID!, $duplicate_type: DuplicateBoardType!, $board_name: String, $workspace_id: ID, $folder_id: ID, $keep_subscribers: Boolean) {
        duplicate_board(board_id: $board_id, duplicate_type: $duplicate_type, board_name: $board_name, workspace_id: $workspace_id, folder_id: $folder_id, keep_subscribers: $keep_subscribers) {
          board { id name url workspace_id }
        }
      }`,
      variables: {
        board_id,
        duplicate_type,
        board_name: board_name || undefined,
        workspace_id: workspace_id || undefined,
        folder_id: folder_id || undefined,
        keep_subscribers: keep_subscribers ?? false,
      },
    });

    const result = data.duplicate_board;
    return {
      id: result.board.id,
      name: result.board.name,
      url: result.board.url,
      workspace_id: result.board.workspace_id ?? null,
      source_board_id: board_id,
    };
  },
});
