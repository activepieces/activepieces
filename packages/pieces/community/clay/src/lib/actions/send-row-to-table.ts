import { createAction, Property } from '@activepieces/pieces-framework';
import { clayWebhook } from '../common/webhook';
import { sendRowOutputSchema } from '../common/output-schemas';

export const sendRowToTableAction = createAction({
    name: 'send_row_to_table',
    displayName: 'Send Row to Clay Table',
    description: 'Sends a row to a Clay table through its webhook source.',
    classification: 'WRITE',
    audience: 'both',
    aiMetadata: {
        description:
            'Sends one row of data into a Clay table through that table\'s webhook source, where it runs the table\'s enrichment columns. Requires the table\'s webhook URL, which is generated in Clay on the table itself and must be an https address on clay.com, plus that source\'s authentication token when it has one. Clay only acknowledges receipt, so a successful call means the row was accepted, not that enrichment has finished. Whether re-sending the same data updates the existing row or appends another one depends on the table\'s own configuration, so treat a retry as capable of adding a duplicate row.',
        idempotent: false,
    },
    outputSchema: sendRowOutputSchema,
    requireAuth: false,
    props: {
        webhookUrl: Property.ShortText({
            displayName: 'Webhook URL',
            description:
                'From the table\'s webhook source in Clay, the value in its Webhook URL panel. Only https addresses on clay.com are accepted.',
            required: true,
        }),
        authToken: Property.ShortText({
            displayName: 'Authentication Token',
            description:
                'The token Clay showed when the source was created. Leave empty only if the source has none. Clay shows it once, so use Refresh auth token on the source if it was not saved.',
            required: false,
        }),
        row: Property.Object({
            displayName: 'Row',
            description:
                'The fields to send, as key-value pairs. Keys should match the source\'s Setup mapping panel.',
            required: true,
        }),
    },
    async run({ propsValue }) {
        return await clayWebhook.sendRow({
            webhookUrl: propsValue.webhookUrl,
            authToken: propsValue.authToken,
            row: propsValue.row,
        });
    },
});
