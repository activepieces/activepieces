import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { addBoardColumnActionOutputSchema } from '../../../output-schemas';

export const addBoardColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_board_column',
  classification: 'WRITE',
  displayName: 'Add Board Column',
  description: 'Adds a new column of a given type to a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add a new column to a monday.com board by type (e.g. text, status, date, numbers, people, dropdown, long_text, email, link). Optionally set a description, position it after another column, and pass type defaults such as status labels (shape from Get Column Type Schema). Check List Columns first to avoid duplicates; each call creates a new column.',
    idempotent: false,
  },
  outputSchema: addBoardColumnActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    column_type: Property.ShortText({
      displayName: 'Column Type',
      description: 'monday.com column type, e.g. text, long_text, status, dropdown, date, timeline, numbers, people, email, phone, link, checkbox, rating, tags, file.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    after_column_id: Property.ShortText({
      displayName: 'After Column ID',
      description: 'Place the new column after this column ID. Leave empty to append.',
      required: false,
    }),
    defaults: Property.Json({
      displayName: 'Defaults',
      description: 'Type-specific settings, e.g. {"labels": {"1": "Done", "2": "Stuck"}} for status. See Get Column Type Schema.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, title, column_type, description, after_column_id, defaults } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_column: MondayColumn }>({
      query: `mutation ($boardId: ID!, $title: String!, $columnType: ColumnType!, $description: String, $afterColumnId: ID, $defaults: JSON) {
        create_column(
          board_id: $boardId
          title: $title
          column_type: $columnType
          description: $description
          after_column_id: $afterColumnId
          defaults: $defaults
        ) {
          id
          title
          type
          description
        }
      }`,
      variables: {
        boardId: board_id,
        title,
        columnType: column_type.trim(),
        ...(isNil(description) ? {} : { description }),
        ...(isNil(after_column_id) ? {} : { afterColumnId: after_column_id }),
        ...(isNil(defaults) ? {} : { defaults: mondayApi.toJsonString(defaults) }),
      },
    });

    const column = data.create_column;
    return {
      id: column.id,
      board_id,
      title: column.title,
      type: column.type,
      description: column.description ?? null,
    };
  },
});

type MondayColumn = {
  id: string;
  title: string;
  type: string;
  description: string | null;
};
