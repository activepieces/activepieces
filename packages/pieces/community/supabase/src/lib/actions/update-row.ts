import { createAction, Property } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const updateRow = createAction({
  auth: supabaseAuth,
  name: 'update_row',
  displayName: 'Update a Row',
  description: 'Updates a row in a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to update',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter Criteria',
      description: 'JSON object with filter conditions to identify which row(s) to update (e.g., {"id": 1})',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Update Data',
      description: 'The data to update as a JSON object',
      required: true,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, filter, data } = context.propsValue;

    if (!table || !table.trim()) {
      throw new Error('Table name is required');
    }

    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
      throw new Error('Filter criteria is required for update operations');
    }

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error('Update data is required');
    }

    const supabase = createClient(url, apiKey);

    // Build the query with filters
    let query = supabase.from(table.trim()).update(data);
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(`Error updating row: ${error.message}`);
    }

    return {
      success: true,
      data: result || [],
      updatedCount: result ? result.length : 0,
      message: `${result ? result.length : 0} row(s) updated successfully`,
    };
  },
});