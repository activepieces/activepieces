import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';

export const findEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'find_email',
    displayName: 'Find Email',
    description: 'Search for an email in your mailbox.',
    props: {
        in_folder: Property.Dropdown({
            displayName: 'Folder',
            description: 'The folder to search in. If left blank, searches all folders in the mailbox.',
            required: false,
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
                
                const response = await client.api('/me/mailFolders').top(100).get();
                const customFolders = response.value.map((folder: { displayName: string; id: string }) => ({
                    label: folder.displayName,
                    value: folder.id,
                }));
                return {
                    disabled: false,
                    options: customFolders,
                };
            },
        }),
        search_term: Property.ShortText({
            displayName: 'Search Term',
            description: 'The search query. Searches the "from", "subject", and "body" fields. Example: "subject:Urgent" or "pizza".',
            required: true,
        }),
    },
    async run(context) {
        const { in_folder, search_term } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const url = in_folder
            ? `/me/mailFolders/${in_folder}/messages`
            : '/me/messages';

        try {
            const response = await client
                .api(url)
                .search(search_term) // The SDK handles proper query formatting
                .get();
            
            // The API returns the results in a 'value' array
            return response.value;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to find email: ${errorMessage}`);
        }
    },
});