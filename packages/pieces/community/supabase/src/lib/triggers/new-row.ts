import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { supabaseAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const newRow = createTrigger({
  auth: supabaseAuth,
  name: 'new_row',
  displayName: 'New Row',
  description: 'Fires when a new row is created in a specified table',
  type: TriggerStrategy.POLLING,
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the table to monitor for new rows',
      required: true,
    }),
    orderColumn: Property.ShortText({
      displayName: 'Order Column',
      description: 'Column to order by (typically created_at or id). Must be sortable.',
      required: true,
      defaultValue: 'created_at',
    }),
  },
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<{ url: string; apiKey: string }, { table: string; orderColumn: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const { url, apiKey } = auth;
    const { table, orderColumn } = propsValue;
    
    const supabase = createClient(url, apiKey);
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderColumn, { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Error fetching rows: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row, index) => ({
      id: row[orderColumn] || `${table}_${index}_${Date.now()}`,
      data: row,
    }));
  },
};