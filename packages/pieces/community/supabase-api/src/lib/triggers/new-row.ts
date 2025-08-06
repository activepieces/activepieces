import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { supabaseApiAuth } from '../../index';
import { createClient } from '@supabase/supabase-js';

export const newRow = createTrigger({
    name: 'new_row',
    displayName: 'New Row',
    description: 'Triggers when a new row is created in a table',
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        // Sample of what the payload looks like
        new: {
            id: 1,
            name: "Sample Row",
            created_at: "2023-01-01T00:00:00Z"
        },
        eventType: "INSERT",
        schema: "public",
        table: "your_table"
    },
    props: {
        table: Property.ShortText({
            displayName: 'Table',
            description: 'The table to watch for new rows',
            required: true,
        }),
        schema: Property.ShortText({
            displayName: 'Schema',
            description: 'Database schema (default: public)',
            required: false,
            defaultValue: 'public'
        })
    },
    async onEnable(context) {
        const { table, schema } = context.propsValue;
        const { url, apiKey } = context.auth;

        // Create Supabase client
        const supabase = createClient(url, apiKey);

        // Create and subscribe to channel
        const channel = supabase
            .channel('activepieces_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: schema,
                    table: table
                },
                (payload) => {
                    // Forward payload to webhook URL
                    if (context.webhookUrl) {
                        fetch(context.webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    }
                }
            )
            .subscribe();

        // Store channel reference for cleanup
        await context.store.put('channel', channel);
    },

    async onDisable(context) {
        // Cleanup: unsubscribe from channel
        const channel = await context.store.get('channel');
        if (channel) {
            channel.unsubscribe();
        }
    },

    async run(context) {
        // Return the webhook payload
        return context.payload;
    }
});