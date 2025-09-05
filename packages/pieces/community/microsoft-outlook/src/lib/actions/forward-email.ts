import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { Recipient } from '@microsoft/microsoft-graph-types';

export const forwardEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'forward_email',
    displayName: 'Forward Email',
    description: 'Forwards an email to new recipients.',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to forward.',
            required: true,
        }),
        toRecipients: Property.Array({
            displayName: 'To Recipients',
            description: 'The email addresses of the recipients.',
            required: true,
        }),
        comment: Property.LongText({
            displayName: 'Comment',
            description: 'An optional comment to add to the forwarded message body.',
            required: false,
        }),
    },
    async run(context) {
        const { messageId, toRecipients, comment } = context.propsValue;
        const recipients = toRecipients as string[];

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const recipientObjects: Recipient[] = recipients.map((email) => ({
            emailAddress: {
                address: email,
            },
        }));

        const payload = {
            toRecipients: recipientObjects,
            comment: comment || '',
        };

        try {
            // This API call forwards the message and returns a 202 Accepted response with no body.
            await client
                .api(`/me/messages/${messageId}/forward`)
                .post(payload);
            
            return {
                success: true,
                message: `Email (ID: ${messageId}) forwarded successfully.`,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to forward email: ${errorMessage}`);
        }
    },
});