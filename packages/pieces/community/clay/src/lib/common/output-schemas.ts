import { OutputSchema } from '@activepieces/pieces-framework';

export const sendRowOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'success',
            label: 'Accepted',
            format: 'boolean',
            description:
                'True when Clay accepted the row. Clay acknowledges receipt only, and the table\'s enrichment columns run afterwards, so this does not mean enrichment has finished.',
        },
        {
            key: 'response',
            label: 'Clay Response',
            description:
                'Clay\'s own acknowledgement, passed through unchanged. Its shape follows the Send response as setting on the webhook source: an object such as {"success": true} for JSON, or the text OK for Plaintext.',
        },
    ],
};
