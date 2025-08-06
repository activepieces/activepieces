import { createAction, Property } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const deleteRows = createAction({
  auth: supabaseAuth,
  name: 'delete_rows',
  displayName: 'Delete Rows',
  description: 'Remove rows matching filter criteria from a table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to delete from',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter Criteria',
      description: 'JSON object with filter conditions (e.g., {"id": 1, "status": "inactive"})',
      required: true,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, filter } = context.propsValue;

    if (!table || !table.trim()) {
      throw new Error('Table name is required');
    }

    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
      throw new Error('Filter criteria is required for delete operations to prevent accidental deletion of all rows');
    }

    const supabase = createClient(url, apiKey);

    // Build the query with filters
    let query = supabase.from(table.trim()).delete();
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error deleting rows: ${error.message}`);
    }

    return {
      success: true,
      message: 'Rows deleted successfully',
    };
  },
});