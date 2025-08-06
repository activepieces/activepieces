import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const searchRowsAction = createAction({
  auth: supabaseAuth,
  name: 'search-rows',
  displayName: 'Search Rows',
  description: 'List rows from a table based on filters and pagination',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    columns: Property.Array({
      displayName: 'Columns to Select',
      required: false,
      description: 'Specific columns to return (leave empty for all columns)'
    }),
    filterColumn: Property.ShortText({
      displayName: 'Filter Column',
      required: false,
      description: 'Column name to filter by'
    }),
    filterOperator: Property.StaticDropdown({
      displayName: 'Filter Operator',
      required: false,
      description: 'Comparison operator',
      options: {
        disabled: false,
        options: [
          { label: 'Equals (=)', value: 'eq' },
          { label: 'Not equals (!=)', value: 'neq' },
          { label: 'Greater than (>)', value: 'gt' },
          { label: 'Greater than or equal (>=)', value: 'gte' },
          { label: 'Less than (<)', value: 'lt' },
          { label: 'Less than or equal (<=)', value: 'lte' },
          { label: 'In array', value: 'in' },
          { label: 'Like (pattern)', value: 'like' },
          { label: 'Is null', value: 'is' }
        ]
      }
    }),
    filterValue: Property.ShortText({
      displayName: 'Filter Value',
      required: false,
      description: 'Value to compare against'
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By Column',
      required: false,
      description: 'Column to order results by'
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      required: false,
      description: 'Sort direction',
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' }
        ]
      }
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of rows to return (default: 100)'
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of rows to skip (default: 0)'
    })
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { 
      table, 
      columns, 
      filterColumn, 
      filterOperator, 
      filterValue, 
      orderBy, 
      orderDirection, 
      limit, 
      offset 
    } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      // Start building query
      const selectColumns = columns?.length ? columns.join(',') : '*';
      let query = supabase.from(table).select(selectColumns);
      
      // Apply filter if provided
      if (filterColumn && filterOperator) {
        switch (filterOperator) {
          case 'eq':
            query = query.eq(filterColumn, filterValue);
            break;
          case 'neq':
            query = query.neq(filterColumn, filterValue);
            break;
          case 'gt':
            query = query.gt(filterColumn, filterValue);
            break;
          case 'gte':
            query = query.gte(filterColumn, filterValue);
            break;
          case 'lt':
            query = query.lt(filterColumn, filterValue);
            break;
          case 'lte':
            query = query.lte(filterColumn, filterValue);
            break;
          case 'in':
            const values = filterValue?.split(',').map(v => v.trim());
            query = query.in(filterColumn, values || []);
            break;
          case 'like':
            query = query.like(filterColumn, filterValue || '');
            break;
          case 'is':
            query = query.is(filterColumn, null);
            break;
        }
      }
      
      // Apply ordering
      if (orderBy) {
        const ascending = !orderDirection || orderDirection === 'asc';
        query = query.order(orderBy, { ascending });
      }
      
      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      
      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to search rows: ${result.error.message}`);
      }
      
      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0,
        totalCount: result.count,
        limit: limit || 100,
        offset: offset || 0
      };
      
    } catch (error) {
      throw new Error(`Search rows failed: ${error}`);
    }
  }
});