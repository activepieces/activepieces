import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { mondayAiProps } from '../../../common/ai-props';
import { updateColumnActionOutputSchema } from '../../../output-schemas';

export const updateColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_column',
  classification: 'WRITE',
  displayName: 'Update Column',
  description: 'Changes a column\'s title and/or description.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename a monday.com board column and/or change its description. Only the fields you provide change; the column type and settings are untouched. Resolve the column ID with List Columns. Re-applying the same values is safe.',
    idempotent: true,
  },
  outputSchema: updateColumnActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    column_id: mondayAiProps.columnId(true),
    title: Property.ShortText({
      displayName: 'New Title',
      description: 'Leave empty to keep the current title.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'New Description',
      description: 'Leave empty to keep the current description.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, column_id, title, description } = context.propsValue;
    if (isNil(title) && isNil(description)) {
      throw new Error('Provide a New Title and/or a New Description.');
    }
    const client = makeClient(context.auth);

    const renamed = isNil(title)
      ? null
      : await client.query<{ change_column_title: MondayColumn }>({
        query: `mutation ($boardId: ID!, $columnId: String!, $title: String!) {
            change_column_title(board_id: $boardId, column_id: $columnId, title: $title) { id title description }
          }`,
        variables: { boardId: board_id, columnId: column_id, title },
      });

    const described = isNil(description)
      ? null
      : await client.query<{ change_column_metadata: MondayColumn }>({
        query: `mutation ($boardId: ID!, $columnId: String!, $value: String) {
            change_column_metadata(board_id: $boardId, column_id: $columnId, column_property: description, value: $value) { id title description }
          }`,
        variables: { boardId: board_id, columnId: column_id, value: description },
      });

    const column = described?.change_column_metadata ?? renamed?.change_column_title;
    return {
      id: column?.id ?? column_id,
      board_id,
      title: column?.title ?? null,
      description: column?.description ?? null,
    };
  },
});

type MondayColumn = {
  id: string;
  title: string;
  description: string | null;
};
