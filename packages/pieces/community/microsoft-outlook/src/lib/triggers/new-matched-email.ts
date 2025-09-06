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
    { folder?: string; from?: string; subject_contains?: string }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const folderId = propsValue.folder || 'inbox';

        const filters = [];
        if (lastFetchEpochMS > 0) {
            filters.push(`receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`);
        }
        if (propsValue.from) {
            // OData requires escaping single quotes in the filter value
            const fromEmail = propsValue.from.replace(/'/g, "''");
            filters.push(`from/emailAddress/address eq '${fromEmail}'`);
        }
        if (propsValue.subject_contains) {
            const subject = propsValue.subject_contains.replace(/'/g, "''");
            filters.push(`contains(subject, '${subject}')`);
        }
        
        const filterString = filters.join(' and ');

        const request = client
            .api(`/me/mailFolders/${folderId}/messages`)
            .orderby('receivedDateTime asc')
            .top(25); // Limit batch size to avoid timeouts

        if (filterString) {
            request.filter(filterString);
        }

        const response = await request.get();
        const messages: Message[] = response.value;

        return messages.map((message) => ({
            epochMilliSeconds: dayjs(message.receivedDateTime).valueOf(),
            data: message,
        }));
    },
};

export const newMatchedEmailTrigger = createTrigger({
    auth: microsoftOutlookAuth,
    name: 'new_matched_email',
    displayName: 'New Matched Email',
    description: 'Triggers when a new email is received that matches the specified criteria.',
    props: {
        folder: Property.Dropdown({
            displayName: 'Folder',
            description: 'The folder to monitor for new emails. Defaults to Inbox.',
            required: false,
            refreshers: [],
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
        from: Property.ShortText({
            displayName: 'From',
            description: "The sender's email address to match against.",
            required: false,
        }),
        subject_contains: Property.ShortText({
            displayName: 'Subject Contains',
            description: 'Text that the subject of the email must contain.',
            required: false,
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