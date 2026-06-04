import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const listRowsAction = createAction({
  name: 'baserow_list_rows',
  displayName: 'List Rows',
  description: 'Lists rows from a table with optional search, sorting, and filtering.',
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
      description: 'Number of rows to return per page. Maximum 200. Defaults to 100.',
    }),
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description: 'Return only rows whose cell data matches this search term.',
    }),
    order_by: Property.ShortText({
      displayName: 'Order By',
      required: false,
      description: 'Field name to sort by. Prefix with **-** for descending or **+** for ascending. Example: `-Name` sorts by Name Z→A.',
    }),
    filter_type: Property.StaticDropdown({
      displayName: 'Filter Combination',
      description: 'How to combine multiple filters. **AND** requires all filters to match; **OR** requires any one filter to match.',
      required: false,
      defaultValue: 'AND',
      options: {
        disabled: false,
        options: [
          { label: 'AND — all filters must match', value: 'AND' },
          { label: 'OR — any filter can match', value: 'OR' },
        ],
      },
    }),
    filter_instructions: Property.MarkDown({
      value: `**How to add filters** (optional):

Each filter is a JSON object with three keys:
- \`field\` — numeric field ID (in Baserow, click the field header; the ID appears in the page URL)
- \`type\` — operator: \`equal\`, \`not_equal\`, \`contains\`, \`contains_not\`, \`higher_than\`, \`lower_than\`, \`is_empty\`, \`is_not_empty\`
- \`value\` — the value to compare against

Example: \`{"field": 123, "type": "equal", "value": "Active"}\``,
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description: 'Each entry is a JSON object with "field" (numeric ID), "type" (operator), and "value". Leave empty to return all rows.',
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
        const filter: Record<string, unknown> =
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

    const response = (await client.listRows(
      table_id!,
      page,
      limit,
      search,
      order_by,
      undefined,
      advancedFilters
    ))

    return { count: response.count, rows: response.results };
  },
});
