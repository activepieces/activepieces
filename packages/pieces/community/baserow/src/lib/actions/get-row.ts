import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../..';
import { makeClient } from '../common';

export const getRowAction = createAction({
  name: 'baserow_get_row',
  displayName: 'Get Row',
  description: 'Fetches a single table row.',
  auth: baserowAuth,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID where you want to get the row from. You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
    row_id: Property.Number({
      displayName: 'Row ID',
      required: true,
      description: 'Please enter the row ID that is requested.',
    }),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof baserowAuth>
    );
    return await client.getRow(table_id, row_id);
  },
});
