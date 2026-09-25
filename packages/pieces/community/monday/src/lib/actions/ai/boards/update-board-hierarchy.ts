import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { updateBoardHierarchyActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const updateBoardHierarchyAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_board_hierarchy',
  classification: 'WRITE',
  displayName: 'Move Board',
  description: 'Moves a board to another workspace, folder or product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move a monday.com board to a different workspace, folder, or account product. Only the destinations you provide are changed. To rename a board or edit its description use Update Board. Requires board-owner rights in both places; moving to the same destination again is a no-op.',
    idempotent: true,
  },
  outputSchema: updateBoardHierarchyActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    workspace_id: Property.ShortText({
      displayName: 'Destination Workspace ID',
      description: 'Resolve it with List Workspaces.',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'Must belong to the destination workspace. Resolve it with List Folders.',
      required: false,
    }),
    account_product_id: Property.ShortText({
      displayName: 'Account Product ID',
      description: 'The account product (e.g. work management, CRM) to move the board to. Requires the destination workspace ID too.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, workspace_id, folder_id, account_product_id } = context.propsValue;
    const attributes = {
      ...(workspace_id ? { workspace_id } : {}),
      ...(folder_id ? { folder_id } : {}),
      ...(account_product_id ? { account_product_id } : {}),
    };
    if (Object.keys(attributes).length === 0) {
      throw new Error('Provide at least one destination: workspace, folder, or account product.');
    }
    if (account_product_id && !workspace_id) {
      throw new Error('Moving to another account product also requires the destination workspace ID in that product.');
    }

    const data = await makeClient(context.auth).query<{
      update_board_hierarchy: { success: boolean; message: string | null; board: { id: string; workspace_id: string | null; board_folder_id: string | null } | null };
    }>({
      query: `mutation ($board_id: ID!, $attributes: UpdateBoardHierarchyAttributesInput!) {
        update_board_hierarchy(board_id: $board_id, attributes: $attributes) {
          success
          message
          board { id workspace_id board_folder_id }
        }
      }`,
      variables: { board_id, attributes },
    });

    const result = data.update_board_hierarchy;
    if (!result.success) {
      throw new Error(`monday.com did not move board ${board_id}: ${result.message ?? 'no reason given'}`);
    }
    return {
      success: result.success,
      message: result.message ?? null,
      board_id: result.board?.id ?? board_id,
      workspace_id: result.board?.workspace_id ?? null,
      folder_id: result.board?.board_folder_id ?? null,
    };
  },
});
