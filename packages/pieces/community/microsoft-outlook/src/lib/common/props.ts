import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const outlookCommon = {
    folder: Property.Dropdown({
        displayName: 'Destination Folder',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authProp = auth as OAuth2PropertyValue;
            const client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: () => Promise.resolve(authProp.access_token),
                },
            });

            // Add common well-known folders for quick access
            const wellKnownFolders = [
                { label: 'Inbox', value: 'inbox' },
                { label: 'Archive', value: 'archive' },
                { label: 'Deleted Items', value: 'deleteditems' },
                { label: 'Drafts', value: 'drafts' },
                { label: 'Sent Items', value: 'sentitems' },
                { label: 'Junk Email', value: 'junkemail' },
            ];
            
            // Fetch the user's custom mail folders
            const response = await client.api('/me/mailFolders').top(100).get();
            const customFolders = response.value.map((folder: { displayName: string; id: string }) => ({
                label: folder.displayName,
                value: folder.id,
            }));

            return {
                disabled: false,
                options: [...wellKnownFolders, ...customFolders],
            };
        },
    }),
    // Add the new draft property below
    draft: Property.Dropdown({
        displayName: 'Draft Email',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authProp = auth as OAuth2PropertyValue;
            const client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: () => Promise.resolve(authProp.access_token),
                },
            });
            
            // Fetch messages from the Drafts folder
            const response = await client.api('/me/mailFolders/drafts/messages')
                .select('id,subject')
                .top(50) // Limit to 50 most recent drafts for performance
                .get();

            const options = response.value.map((message: { subject: string; id: string }) => ({
                label: message.subject || '(No Subject)',
                value: message.id,
            }));

            return {
                disabled: false,
                options: options,
            };
        },
    }),
};