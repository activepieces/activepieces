import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../..';
import { makeClient } from '../common';

export const deleteRowAction = createAction({
  name: 'baserow_delete_row',
  displayName: 'Delete Row',
  description: 'Deletes an existing row.',
  auth: baserowAuth,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID where the row must be deleted in.You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
    row_id: Property.Number({
      displayName: 'Row ID',
      required: true,
      description: 'Please enter the row ID that needs to be deleted.',
    }),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof baserowAuth>
    );
    return await client.deleteRow(table_id, row_id);
  },
});
