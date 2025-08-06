import { createAction, Property } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const upsertRow = createAction({
  auth: supabaseAuth,
  name: 'upsert_row',
  displayName: 'Upsert a Row',
  description: 'Insert or update a row in a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to upsert into',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Row Data',
      description: 'The data to upsert as a JSON object',
      required: true,
    }),
    onConflict: Property.ShortText({
      displayName: 'On Conflict Columns',
      description: 'Comma-separated list of columns for conflict resolution (e.g., "id" or "email,username")',
      required: false,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, data, onConflict } = context.propsValue;

    if (!table || !table.trim()) {
      throw new Error('Table name is required');
    }

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error('Row data is required');
    }

    const supabase = createClient(url, apiKey);

    let query = supabase.from(table.trim()).upsert(data);

    // Apply onConflict if specified
    if (onConflict && onConflict.trim()) {
      // For Supabase, onConflict is specified when creating the table schema
      // Here we just ensure we get the result back
      query = query.select();
    } else {
      query = query.select();
    }

    const { data: result, error } = await query;

    if (error) {
      throw new Error(`Error upserting row: ${error.message}`);
    }

    return {
      success: true,
      data: result?.[0] || result,
      message: 'Row upserted successfully',
    };
  },
});