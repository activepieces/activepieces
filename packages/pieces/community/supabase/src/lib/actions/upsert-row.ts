import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const upsertRowAction = createAction({
  auth: supabaseAuth,
  name: 'upsert-row',
  displayName: 'Upsert a Row',
  description: 'Insert a new row or update existing row in a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    data: Property.Object({
      displayName: 'Row Data',
      required: true,
      description: 'Data for the row (JSON object)'
    }),
    onConflict: Property.ShortText({
      displayName: 'Conflict Column(s)',
      required: false,
      description: 'Column name(s) for conflict resolution (comma-separated). Leave empty for default.'
    }),
    returnData: Property.Checkbox({
      displayName: 'Return Row Data',
      required: false,
      description: 'Return the upserted row data'
    })
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, data, onConflict, returnData } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      let query = supabase.from(table).upsert(data);
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to upsert row: ${result.error.message}`);
      }
      
      return {
        success: true,
        data: returnData ? result.data : null,
        message: 'Row upserted successfully'
      };
      
    } catch (error) {
      throw new Error(`Upsert row failed: ${error}`);
    }
  }
});