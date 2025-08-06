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

    const supabase = createClient(url, apiKey);

    let query = supabase.from(table).upsert(data);

    // Apply onConflict if specified
    if (onConflict && onConflict.trim()) {
      const conflictColumns = onConflict.split(',').map(col => col.trim());
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