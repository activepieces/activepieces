import { createAction, Property } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const searchRows = createAction({
  auth: supabaseAuth,
  name: 'search_rows',
  displayName: 'Search Rows',
  description: 'List rows from a table based on filters and pagination',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to search',
      required: true,
    }),
    columns: Property.ShortText({
      displayName: 'Columns',
      description: 'Comma-separated list of columns to select (* for all columns)',
      required: false,
      defaultValue: '*',
    }),
    filter: Property.Json({
      displayName: 'Filter Criteria',
      description: 'JSON object with filter conditions (e.g., {"status": "active", "age": 25})',
      required: false,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'Column to order by (e.g., "created_at" or "name")',
      required: false,
    }),
    ascending: Property.Checkbox({
      displayName: 'Ascending Order',
      description: 'Sort in ascending order (unchecked for descending)',
      required: false,
      defaultValue: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return (default: 100, max: 1000)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of rows to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, columns, filter, orderBy, ascending, limit, offset } = context.propsValue;

    const supabase = createClient(url, apiKey);

    // Validate and set limits
    const finalLimit = Math.min(limit || 100, 1000);
    const finalOffset = Math.max(offset || 0, 0);
    const selectColumns = columns?.trim() || '*';

    // Build the query
    let query = supabase.from(table).select(selectColumns, { count: 'exact' });

    // Apply filters
    if (filter && typeof filter === 'object') {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (orderBy && orderBy.trim()) {
      query = query.order(orderBy.trim(), { ascending: ascending ?? true });
    }

    // Apply pagination
    query = query.range(finalOffset, finalOffset + finalLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error searching rows: ${error.message}`);
    }

    return {
      success: true,
      data: data || [],
      count: data ? data.length : 0,
      totalCount: count,
      limit: finalLimit,
      offset: finalOffset,
      hasMore: count ? (finalOffset + finalLimit) < count : false,
      message: `Found ${data ? data.length : 0} rows`,
    };
  },
});