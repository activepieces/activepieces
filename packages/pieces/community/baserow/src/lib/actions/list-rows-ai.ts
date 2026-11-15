import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listRowsAiOutputSchema } from '../output-schemas';

export const listRowsAiAction = createAction({
  name: 'baserow_list_rows_ai',
  classification: 'SEARCH',
  outputSchema: listRowsAiOutputSchema,
  displayName: 'List Rows',
  description: 'Lists rows from a table with optional search, sorting, filters and view.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of rows from a Baserow table, optionally narrowed by free-text search, structured filters (AND/OR over field names), a view, and a field selection. Use to browse or query many rows; for one row by ID use Get Row, or for an exact single-field match use Find Row. Page size is at most 200 — follow `next` by incrementing Page. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only return rows with cell data matching this text.',
      required: false,
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description:
        'Optional filter tree: {"filter_type": "AND" | "OR", "filters": [{"field": "<field name or ID>", "type": "<operator>", "value": "<value>"}], "groups": [<nested tree>]}. Operators include equal, not_equal, contains, contains_not, higher_than, lower_than, date_is, empty, not_empty, boolean, link_row_has, single_select_equal.',
      required: false,
    }),
    order_by: Property.ShortText({
      displayName: 'Order By',
      description: 'Comma-separated field names; prefix a name with "-" for descending, e.g. "-Created,Name".',
      required: false,
    }),
    include: Property.Array({
      displayName: 'Include Fields',
      description: 'Only return these field names. Leave empty for all fields.',
      required: false,
    }),
    exclude: Property.Array({
      displayName: 'Exclude Fields',
      description: 'Field names to leave out of the response.',
      required: false,
    }),
    view_id: Property.Number({
      displayName: 'View ID',
      description: 'Apply the filters and sorts saved on this view. Resolve with List Views.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Rows per page, 1–200. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { table_id, search, filters, order_by, include, exclude, view_id, page, size } =
      context.propsValue;
    if (size !== undefined && size !== null && (size < 1 || size > 200)) {
      throw new Error('Page Size must be between 1 and 200.');
    }
    const query: Record<string, string> = {
      page: String(page ?? 1),
      size: String(size ?? 100),
      ...(search ? { search } : {}),
      ...(order_by ? { order_by } : {}),
      ...(include && include.length > 0 ? { include: include.map(String).join(',') } : {}),
      ...(exclude && exclude.length > 0 ? { exclude: exclude.map(String).join(',') } : {}),
      ...(view_id ? { view_id: String(view_id) } : {}),
      ...(filters
        ? {
            filters: JSON.stringify(
              baserowAiHelpers.toRecord({ value: filters, propName: 'Filters' })
            ),
          }
        : {}),
    };
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() =>
      client.queryRows({ tableId: table_id, query })
    );
    return {
      count: response.count,
      has_more: response.next !== null,
      rows: response.results,
    };
  },
});
