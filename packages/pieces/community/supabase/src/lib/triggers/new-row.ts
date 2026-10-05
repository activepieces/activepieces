import { createTrigger, isNil, MarkdownVariant, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import crypto from 'crypto';
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
        old_record: null,
        timestamp: "2023-01-01T00:00:01Z",
        raw_payload: {
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
        }
    },
    props: {
        instructions: Property.MarkDown({
            value: `1. In Supabase, open **Database → Webhooks** and click **Create a new hook**.
2. Pick the table, tick **Insert**, and choose **HTTP Request** with method **POST**.
3. Paste this URL:

\`\`\`text
{{webhookUrl}}
\`\`\`

4. Optional: add this HTTP header, set to your Webhook Secret (Advanced):
   **x-webhook-secret**
5. Click **Create webhook**.

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
        }),
        webhook_secret: Property.ShortText({
            displayName: 'Webhook Secret',
            description: 'If set, requests must send it in an x-webhook-secret header.',
            required: false,
            advanced: true
        })
    },
    outputSchema: newRowTriggerOutputSchema,
    async onEnable(context) {
        if (!context.webhookUrl) {
            throw new Error('Webhook URL is required for Supabase triggers');
        }
    },

    async onDisable() {
        return;
    },

    async run(context) {
        const payload = context.payload.body;

        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid webhook payload received from Supabase');
        }

        if (!isSupabaseWebhookPayload(payload)) {
            throw new Error('Payload missing required Supabase webhook fields (type, table)');
        }

        const { table_name, schema, webhook_secret } = context.propsValue;
        const secret = trimmedSecretOf(webhook_secret);

        if (!isNil(secret)) {
            const provided = headerValueOf({ headers: context.payload.headers, name: WEBHOOK_SECRET_HEADER });
            if (isNil(provided) || !secretMatches({ expected: secret, provided })) {
                throw new Error('The x-webhook-secret header did not match Webhook Secret.');
            }
        }

        if (payload.type !== 'INSERT') {
            return [];
        }

        if (payload.table !== table_name || (payload.schema ?? 'public') !== (schema || 'public')) {
            return [];
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

function isSupabaseWebhookPayload(body: object): body is SupabaseWebhookPayload {
    const type: unknown = Reflect.get(body, 'type');
    const table: unknown = Reflect.get(body, 'table');
    const schema: unknown = Reflect.get(body, 'schema');
    return typeof type === 'string'
        && type.length > 0
        && typeof table === 'string'
        && table.length > 0
        && (isNil(schema) || typeof schema === 'string');
}

function trimmedSecretOf(secret: string | undefined): string | undefined {
    const trimmed = secret?.trim();
    return isNil(trimmed) || trimmed.length === 0 ? undefined : trimmed;
}

function headerValueOf({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | undefined {
    if (isNil(headers)) {
        return undefined;
    }
    const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
    if (isNil(match)) {
        return undefined;
    }
    const value: unknown = headers[match];
    return typeof value === 'string' ? value : undefined;
}

function secretMatches({ expected, provided }: { expected: string; provided: string }): boolean {
    const expectedBytes = Buffer.from(expected);
    const providedBytes = Buffer.from(provided);
    if (expectedBytes.length !== providedBytes.length) {
        return false;
    }
    return crypto.timingSafeEqual(expectedBytes, providedBytes);
}

const WEBHOOK_SECRET_HEADER = 'x-webhook-secret';

type SupabaseWebhookPayload = {
    type: string;
    table: string;
    schema?: string | null;
    record?: unknown;
    old_record?: unknown;
};