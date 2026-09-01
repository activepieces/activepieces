import { createAction, Property } from '@activepieces/pieces-framework';
import { sendClayWebhookRecord } from '../common';

export const createRecordAction = createAction({
    name: 'create_record',
    classification: 'WRITE',
    displayName: 'Create Record in Table',
    description: 'Adds a new row to a Clay table via its webhook source.',
    audience: 'both',
    aiMetadata: {
        description:
            'Add a new row to a Clay table by posting field values to the table\'s webhook URL. Use this to insert a brand-new record; to change an existing row instead, use Update Record in Table. Each call always creates another row, so retries duplicate.',
        idempotent: false,
    },
    props: {
        webhook_instructions: Property.MarkDown({
            value:
                '**Get your webhook URL**\n1. Open the Clay table you want to add rows to.\n2. Click **+ Add** at the bottom of the table.\n3. Search for **Webhooks** and choose **Monitor webhook**.\n4. Copy the URL shown and paste it below.',
        }),
        webhook_url: Property.ShortText({
            displayName: 'Webhook URL',
            description: 'The webhook URL of the Clay table to add a row to.',
            required: true,
            placeholder: 'https://api.clay.com/webhook/...',
        }),
        auth_token: Property.ShortText({
            displayName: 'Authentication Token',
            description:
                'Optional. If you added an authentication token when creating the webhook source in Clay, paste it here. It is sent as the "x-clay-webhook-auth" header.',
            required: false,
        }),
        fields: Property.Object({
            displayName: 'Record Fields',
            description:
                'Column name to value pairs for the new row. Names must exactly match your Clay table\'s column names, otherwise Clay creates new columns for any that do not match.',
            required: true,
        }),
    },
    async run(context) {
        const response = await sendClayWebhookRecord({
            webhookUrl: context.propsValue.webhook_url,
            authToken: context.propsValue.auth_token,
            fields: context.propsValue.fields as Record<string, unknown>,
        });
        return response.body;
    },
});
