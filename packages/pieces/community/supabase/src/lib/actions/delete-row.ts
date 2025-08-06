import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const deleteRowsAction = createAction({
  auth: supabaseAuth,
  name: 'delete-rows',
  displayName: 'Delete Rows',
  description: 'Remove rows matching filter criteria from a table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    filterColumn: Property.ShortText({
      displayName: 'Filter Column',
      required: true,
      description: 'Column name to filter by'
    }),
    filterOperator: Property.StaticDropdown({
      displayName: 'Filter Operator',
      required: true,
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
      description: 'Value to compare against (not needed for "is null")'
    }),
    returnDeleted: Property.Checkbox({
      displayName: 'Return Deleted Rows',
      required: false,
      description: 'Return the deleted row data'
    })
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, filterColumn, filterOperator, filterValue, returnDeleted } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      let query = supabase.from(table).delete();
      
      // Apply filter based on operator
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
        default:
          throw new Error(`Unsupported operator: ${filterOperator}`);
      }
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to delete rows: ${result.error.message}`);
      }
      
      const deletedCount = result.data;
      
      return {
        success: true,
        deletedCount: deletedCount,
        deletedRows: returnDeleted ? result.data : null,
        message: `Successfully deleted ${deletedCount} rows`
      };
      
    } catch (error) {
      throw new Error(`Delete rows failed: ${error}`);
    }
  }
});