import { createTrigger, MarkdownVariant, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { supabaseAuth } from '../auth';
import { supabaseCommon } from '../common/props';
import { newRowTriggerOutputSchema } from '../output-schemas';

export const newRow = createTrigger({
    name: 'new_row',
    classification: 'READ',
    displayName: 'New Row',
    description: 'Fires when a new row is created in a table',
    aiMetadata: {
        description: 'Fires when a new row is inserted into the configured Supabase table, delivering the inserted record. Relies on a Supabase Database Webhook (configured manually in the dashboard) pointed at this trigger and listening for INSERT events on the chosen table and schema.',
    },
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
            value: `1. In Supabase, open **Database → Webhooks** and click **Create a new hook**.
2. Pick the table, tick **Insert**, and choose **HTTP Request** with method **POST**.
3. Paste this URL, then click **Create webhook**:

\`\`\`text
{{webhookUrl}}
\`\`\`

[Supabase webhook docs](https://supabase.com/docs/guides/database/webhooks)`,
            variant: MarkdownVariant.INFO,
        }),
        table_name: supabaseCommon.table_name,
        schema: Property.ShortText({
            displayName: 'Schema',
            description: 'Change only if the table is not in the public schema.',
            required: false,
            defaultValue: 'public',
            advanced: true
        })
    },
    outputSchema: newRowTriggerOutputSchema,
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