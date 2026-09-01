import { createAction, Property } from '@activepieces/pieces-framework';
import { sendClayWebhookRecord } from '../common';

export const updateRecordAction = createAction({
    requireAuth: false,
    name: 'update_record',
    classification: 'WRITE',
    displayName: 'Update Record in Table',
    description:
        'Updates an existing row in a Clay table via its webhook source. Requires the table to have Auto-dedupe enabled on a matching column in Clay.',
    audience: 'both',
    aiMetadata: {
        description:
            'Update an existing row in a Clay table by posting field values to the table\'s webhook URL, including the value of the column configured for Auto-dedupe. Use this instead of Create Record in Table when you want to overwrite a matching row rather than insert a new one. Safe to retry with the same matching value.',
        idempotent: true,
    },
    props: {
        webhook_instructions: Property.MarkDown({
            value:
                '**Get your webhook URL**\n1. Open the Clay table you want to update a row in.\n2. Click **+ Add** at the bottom of the table.\n3. Search for **Webhooks** and choose **Monitor webhook**.\n4. Copy the URL shown and paste it below.\n\n**Enable Auto-dedupe (required to actually update rows)**\n1. On the table, click the **Auto-dedupe** icon at the bottom right.\n2. Choose **Enable automatic deduplication** and pick the column with a unique identifier (e.g. email, URL).\n3. Below, include that column\'s value in **Record Fields** — that\'s what Clay matches on to find the row to update. Without this, Clay inserts a new row instead of updating one.',
        }),
        webhook_url: Property.ShortText({
            displayName: 'Webhook URL',
            description: 'The webhook URL of the Clay table to update a row in.',
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
            description: 'Column name to value pairs for the row, including the Auto-dedupe match column.',
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
