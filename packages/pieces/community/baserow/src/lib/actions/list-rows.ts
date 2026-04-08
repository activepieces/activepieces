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
    filter_type: Property.StaticDropdown({
      displayName: 'Filter Type',
      description:
        'When AND is selected, all filters must match. When OR is selected, any filter can match.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'AND', value: 'AND' },
          { label: 'OR', value: 'OR' },
        ],
      },
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description:
        'List of filters. Each filter is an object with "field" (field ID as number), "type" (operator), and "value" (filter value).',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, page, limit, search, order_by, filter_type, filters } =
      context.propsValue;
    const client = await makeClient(context.auth);

    let advancedFilters:
      | {
          filter_type: string;
          filters: { field: number; type: string; value: string }[];
        }
      | undefined;

    if (filters && filters.length > 0) {
      const parsedFilters = filters.map((f) => {
        const filter =
          typeof f === 'string' ? JSON.parse(f) : (f as Record<string, unknown>);
        return {
          field: Number(filter['field']),
          type: String(filter['type'] ?? 'equal'),
          value: String(filter['value'] ?? ''),
        };
      });
      advancedFilters = {
        filter_type: filter_type ?? 'AND',
        filters: parsedFilters,
      };
    }

    return await client.listRows(
      table_id!,
      page,
      limit,
      search,
      order_by,
      undefined,
      advancedFilters
    );
  },
});
