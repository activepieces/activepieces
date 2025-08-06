import { supabaseAuth } from '../../index';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';

export const newRowTrigger = createTrigger({
  auth: supabaseAuth,
  name: 'new-row',
  displayName: 'New Row',
  description: 'Triggers when a new row is created in a table',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      required: true,
      description: 'Name of the database table'
    }),
    columns: Property.Array({
      displayName: 'Columns to Return',
      required: false,
      description: 'Specific columns to return (leave empty for all columns)'
    })
  },
  sampleData:{},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store?.put('lastCheck', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('lastCheck');
  },
  async run(context) {
    const { url, apiKey } = context.auth;
    const { table, columns } = context.propsValue;
    const supabase = createClient(url, apiKey);
    
    try {
      // Get last check time
      const lastCheck = await context.store?.get('lastCheck') || new Date(Date.now() - 60000).toISOString();
      const selectColumns = columns?.length ? columns.join(',') : '*';
      let query = supabase.from(table).select(selectColumns);
      
      if (lastCheck) {
        query = query.gte('created_at', lastCheck);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const result = await query;
      
      if (result.error) {
        throw new Error(`Failed to fetch new rows: ${result.error.message}`);
      }

      await context.store?.put('lastCheck', new Date().toISOString());

      return (result.data || []).reverse();
      
    } catch (error) {
      throw new Error(`New row trigger failed: ${error}`);
    }
  }
});