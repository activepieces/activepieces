import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    OAuth2PropertyValue,
    PiecePropValueSchema,
    Property,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<
    PiecePropValueSchema<typeof microsoftOutlookAuth>, 
    { folders: string[] }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const folders = propsValue.folders;
        if (!folders || folders.length === 0) {
            return [];
        }

        const allNewMessages: Message[] = [];
        
        // On the first run, fetch the last 10 emails. On subsequent runs, fetch all new emails since the last run.
        const filter = lastFetchEpochMS > 0 ? `receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}` : '';
        const order = lastFetchEpochMS > 0 ? 'asc' : 'desc';
        const top = lastFetchEpochMS > 0 ? 100 : 10;

        for (const folderId of folders) {
            const request = client
                .api(`/me/mailFolders/${folderId}/messages`)
                .orderby(`receivedDateTime ${order}`)
                .top(top);

            if (filter) {
                request.filter(filter);
            }
            
            let response = await request.get();

            // Handle pagination to retrieve all new emails since the last poll
            if (lastFetchEpochMS > 0) {
                 while (response.value.length > 0) {
                    allNewMessages.push(...response.value);
                    if (response['@odata.nextLink']) {
                        response = await client.api(response['@odata.nextLink']).get();
                    } else {
                        break;
                    }
                }
            } else {
                allNewMessages.push(...response.value);
            }
        }
        
        return allNewMessages.map((message) => ({
            epochMilliSeconds: dayjs(message.receivedDateTime).valueOf(),
            data: message,
        }));
    },
};

export const newEmailInFolderTrigger = createTrigger({
    auth: microsoftOutlookAuth,
    name: 'new_email_in_folder',
    displayName: 'New Email in Folder',
    description: 'Triggers when a new email is received in one or more specified folders.',
    props: {
        folders: Property.MultiSelectDropdown({
            displayName: 'Folders',
            description: 'The folder(s) to monitor for new emails.',
            required: true,
            refreshers: [], // This line was missing
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                const authProp = auth as OAuth2PropertyValue;
                const client = Client.initWithMiddleware({
                    authProvider: { getAccessToken: () => Promise.resolve(authProp.access_token) },
                });
                const response = await client.api('/me/mailFolders').top(100).get();
                return {
                    disabled: false,
                    options: response.value.map((folder: { displayName: string; id: string }) => ({
                        label: folder.displayName,
                        value: folder.id,
                    })),
                };
            },
        }),
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});