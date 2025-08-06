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

    const supabase = createClient(url, apiKey);

    // Build the query with filters
    let query = supabase.from(table).delete();
    
    // Apply filters
    if (filter && typeof filter === 'object') {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

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