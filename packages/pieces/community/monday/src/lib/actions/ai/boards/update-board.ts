import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { updateBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const updateBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_board',
  classification: 'WRITE',
  displayName: 'Update Board',
  description: "Updates a board's name, description or communication value.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Change one attribute of an existing monday.com board: its name, description, or communication value. Only the chosen attribute is changed. To move a board to another workspace or folder use Update Board Hierarchy. Setting the same value again leaves the board unchanged, so it is safe to retry.",
    idempotent: true,
  },
  outputSchema: updateBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    board_attribute: Property.StaticDropdown({
      displayName: 'Attribute',
      required: true,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Description', value: 'description' },
          { label: 'Communication', value: 'communication' },
        ],
      },
    }),
    new_value: Property.LongText({
      displayName: 'New Value',
      required: true,
    }),
  },
  async run(context) {
    const { board_id, board_attribute, new_value } = context.propsValue;

    const data = await makeClient(context.auth).query<{ update_board: unknown }>({
      query: `mutation ($board_id: ID!, $board_attribute: BoardAttributes!, $new_value: String!) {
        update_board(board_id: $board_id, board_attribute: $board_attribute, new_value: $new_value)
      }`,
      variables: { board_id, board_attribute, new_value },
    });

    const result = parseResult(data.update_board);
    return {
      board_id,
      attribute: board_attribute,
      new_value,
      success: result.success,
    };
  },
});

function parseResult(raw: unknown): { success: boolean } {
  const value = typeof raw === 'string' ? safeParse(raw) : raw;
  if (typeof value === 'object' && value !== null && 'success' in value) {
    return { success: Boolean(value.success) };
  }
  return { success: true };
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
