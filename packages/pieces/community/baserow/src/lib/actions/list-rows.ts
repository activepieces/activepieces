import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../..';
import { makeClient } from '../common';

export const listRowsAction = createAction({
  name: 'baserow_list_rows',
  displayName: 'List Rows',
  description: 'Finds a page of rows in given table.',
  auth: baserowAuth,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID where you want to get the rows from. You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'The maximum number of rows to return.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description:
        'If provided only rows with cell data that matches the search query are going to be returned.',
    }),
    order_by: Property.ShortText({
      displayName: 'Order By',
      required: false,
      description: `If provided rows will be order by specific field.Use **-** sign for descending / **+** sing for ascending ordering.
        Example. "-My Field" will return rows in descending order based on "My Field" field.`,
    }),
  },
  async run(context) {
    const { table_id, limit, search, order_by } = context.propsValue;
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof baserowAuth>
    );
    return await client.listRows(table_id, limit, search, order_by);
  },
});
