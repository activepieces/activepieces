import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const listRowsAction = createAction({
  name: 'baserow_list_rows',
  displayName: 'List Rows',
  description: 'Finds a page of rows in given table.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
      description: 'Page number to return. Defaults to 1.',
    }),
    limit: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 100,
      description: 'Number of rows to return per page. Defaults to 100.',
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
    const { table_id, page, limit, search, order_by } = context.propsValue as {table_id: number, page?: number, limit?: number, search?: string, order_by?: string};
    const client = makeClient(context.auth.props);
    return await client.listRows(table_id, page, limit, search, order_by);
  },
});
