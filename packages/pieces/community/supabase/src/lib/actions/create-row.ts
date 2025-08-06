import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const createRowAction = createAction({
  auth: supabaseAuth,
  name: 'create-row',
  displayName: 'Create a Row',
  description: 'Insert a new row into a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    data: Property.Object({
      displayName: 'Row Data',
      required: true,
      description: 'Data for the new row (JSON object)'
    }),
    returnData: Property.Checkbox({
      displayName: 'Return Created Row',
      required: false,
      description: 'Return the created row data'
    })
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, data, returnData } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      let query = supabase.from(table).insert(data);
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to create row: ${result.error.message}`);
      }
      
      return {
        success: true,
        data: returnData ? result.data : null,
        message: 'Row created successfully'
      };
      
    } catch (error) {
      throw new Error(`Create row failed: ${error}`);
    }
  }
});