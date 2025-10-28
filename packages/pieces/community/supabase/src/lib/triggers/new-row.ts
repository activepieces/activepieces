import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../../index';
import { supabaseCommon } from '../common/props';

export const newRow = createTrigger({
    name: 'new_row',
    displayName: 'New Row',
    description: 'Fires when a new row is created in a table',
    auth: supabaseAuth,
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        type: "INSERT",
        table: "customers",
        schema: "public",
        record: {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            created_at: "2023-01-01T00:00:00Z"
        },
        old_record: null
    },
    props: {
        instructions: Property.MarkDown({
            value: `## Setup Instructions

1. **Go to your Supabase Dashboard** → Database → Webhooks
2. **Click "Create a new hook"**
3. **Configure the webhook:**
   - **Name**: Give it a descriptive name (e.g., "Activepieces New Row")
   - **Table**: Select the table you want to monitor
   - **Events**: Check "Insert" 
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: Copy and paste the webhook URL below
4. **Click "Create webhook"**

**Webhook URL:** \`{{webhookUrl}}\`

## Important Notes
- The webhook will send a JSON payload with the new row data
- Make sure your table has the necessary permissions
- You can test the webhook by inserting a new row into your table

For more details, see [Supabase Database Webhooks documentation](https://supabase.com/docs/guides/database/webhooks).`
        }),
        table_name: supabaseCommon.table_name,
        schema: Property.ShortText({
            displayName: 'Schema',
            description: 'Database schema (default: public)',
            required: false,
            defaultValue: 'public'
        })
    },
    async onEnable(context) {
        const { table_name, schema } = context.propsValue;

        if (!context.webhookUrl) {
            throw new Error('Webhook URL is required for Supabase triggers');
        }

        const webhookConfig = {
            table: table_name,
            schema: schema || 'public',
            event: 'INSERT',
            webhook_url: context.webhookUrl,
            setup_instructions: 'Manual setup required in Supabase Dashboard'
        };

        await context.store.put('webhook_config', webhookConfig);
    },

    async onDisable(context) {
        try {
            await context.store.delete('webhook_config');
        } catch (error) {
            console.log('Error cleaning up webhook config:', error);
        }
    },

    async run(context) {
        const payload = context.payload.body as any;
        
        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid webhook payload received from Supabase');
        }

        if (!payload.type || !payload.table) {
            throw new Error('Payload missing required Supabase webhook fields (type, table)');
        }

        if (payload.type !== 'INSERT') {
            throw new Error(`Expected INSERT event, received ${payload.type}`);
        }

        return [{
            type: payload.type,
            table: payload.table,
            schema: payload.schema || 'public',
            record: payload.record || null,
            old_record: payload.old_record || null,
            timestamp: new Date().toISOString(),
            raw_payload: payload
        }];
    }
});