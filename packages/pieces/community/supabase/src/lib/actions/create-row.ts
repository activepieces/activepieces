import { createAction, Property } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const createRow = createAction({
  auth: supabaseAuth,
  name: 'create_row',
  displayName: 'Create a Row',
  description: 'Insert a new row into a specified table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to insert into',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Row Data',
      description: 'The data to insert as a JSON object',
      required: true,
    }),
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, data } = context.propsValue;

    if (!table || !table.trim()) {
      throw new Error('Table name is required');
    }

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error('Row data is required');
    }

    const supabase = createClient(url, apiKey);

    const { data: result, error } = await supabase
      .from(table.trim())
      .insert(data)
      .select();

    if (error) {
      throw new Error(`Error creating row: ${error.message}`);
    }

    return {
      success: true,
      data: result?.[0] || result,
      message: 'Row created successfully',
    };
  },
});