import { supabaseAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const updateRowAction = createAction({
  auth: supabaseAuth,
  name: 'update-row',
  displayName: 'Update a Row',
  description: 'Update a row in a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    updateData: Property.Object({
      displayName: 'Update Data',
      required: true,
      description: 'Data to update (JSON object)'
    }),
    filterColumn: Property.ShortText({
      displayName: 'Filter Column',
      required: true,
      description: 'Column name to identify the row to update'
    }),
    filterValue: Property.ShortText({
      displayName: 'Filter Value',
      required: true,
      description: 'Value to match for the row to update'
    }),
    returnUpdated: Property.Checkbox({
      displayName: 'Return Updated Row',
      required: false,
      description: 'Return the updated row data'
    })
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, updateData, filterColumn, filterValue, returnUpdated } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      let query = supabase
        .from(table)
        .update(updateData)
        .eq(filterColumn, filterValue);
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to update row: ${result.error.message}`);
      }
      
      const updatedCount = result.data ;
      
      return {
        success: true,
        updatedCount: updatedCount,
        updatedRow: returnUpdated ? result.data : null,
        message: `Successfully updated ${updatedCount} row(s)`
      };
      
    } catch (error) {
      throw new Error(`Update row failed: ${error}`);
    }
  }
});