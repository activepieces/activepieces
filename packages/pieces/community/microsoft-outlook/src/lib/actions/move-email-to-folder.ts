import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { outlookCommon } from '../common/props';

export const moveEmailToFolderAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'move_email_to_folder',
    displayName: 'Move Email to Folder',
    description: 'Moves an email to the specified folder.',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to move.',
            required: true,
        }),
        destinationFolderId: outlookCommon.folder,
    },
    async run(context) {
        const { messageId, destinationFolderId } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        try {
            const response = await client
                .api(`/me/messages/${messageId}/move`)
                .post({
                    destinationId: destinationFolderId,
                });
            
            return response;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to move email: ${errorMessage}`);
        }
    },
});