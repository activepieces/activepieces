import { createAction } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { outlookCommon } from '../common/props';

export const sendDraftEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'send_draft_email',
    displayName: 'Send Draft Email',
    description: 'Sends a previously created draft email.',
    props: {
        messageId: outlookCommon.draft,
    },
    async run(context) {
        const { messageId } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        try {
            // This API call sends the draft and returns a 202 Accepted response with no body.
            await client
                .api(`/me/messages/${messageId}/send`)
                .post({});
            
            return {
                success: true,
                message: `Draft email (ID: ${messageId}) sent successfully.`,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to send draft email: ${errorMessage}`);
        }
    },
});