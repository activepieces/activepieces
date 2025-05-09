import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zohoMailAuth } from '../../index';
import { fetchAccounts, fetchFolders, getZohoMailApiUrl } from '../common';
import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

interface TriggerAuthProps extends OAuth2PropertyValue {
    data_center: string;
}

interface ZohoEmail {
    messageId: string;
    subject?: string;
    sender?: string; // Or fromAddress / mailFrom in some API responses
    fromAddress?: string; // Explicitly from API docs sample
    toAddress?: string;
    ccAddress?: string;
    summary?: string;
    receivedTime?: string; // Timestamp string, needs parsing
    sentDateInGMT?: string; // As per API sample
    status?: string; // e.g., "0" for unread, "1" for read
    hasAttachment?: string; // "0" or "1"
    folderId?: string;
    threadId?: string;
    // Other potentially useful fields from a list view:
    size?: string;
    priority?: string;
    flagid?: string; // e.g., "flag_not_set", "info"
    hasInline?: string; // "true" or "false"
    threadCount?: string;
}

interface ListEmailsResponse {
    status: { code: number; description: string; };
    data: ZohoEmail[];
    // moreData?: boolean; // If API supports pagination
}

const TRIGGER_DATA_STORE_KEY = 'new_email_last_processed_timestamp';

export const newEmailReceived = createTrigger({
    auth: zohoMailAuth,
    name: 'new_email_received',
    displayName: 'New Email Received',
    description: 'Triggers when a new email is received in a specified folder (or inbox).',
    props: {
        accountId: Property.Dropdown({
            displayName: 'Account ID',
            description: 'Select the Zoho Mail Account ID.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const accounts = await fetchAccounts(auth as TriggerAuthProps);
                if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
                return { disabled: false, options: accounts };
            },
        }),
        folderId: Property.Dropdown({
            displayName: 'Folder (Optional)',
            description: 'Select the folder to watch. If empty, watches the inbox/all messages based on API default.',
            required: false,
            refreshers: ['accountId'],
            options: async ({ auth, accountId }) => {
                if (!auth || !accountId) return { disabled: true, placeholder: 'Select an account first', options: [] };
                const folders = await fetchFolders(auth as TriggerAuthProps, accountId as string);
                return { disabled: false, options: [{label: 'All Folders (Default)', value: ''}, ...folders] };
            },
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        messageId: "1709887058769100001",
        subject: "Re: Hello ",
        fromAddress: "rebecca@zylker.com", // Changed sender to fromAddress for consistency
        toAddress: "paul@zylker.com",
        receivedTime: "1709887053409",
        sentDateInGMT: "1709867251000",
        summary: "reply test",
        folderId: "9000000002014",
        status: "1", // Example: read
        hasAttachment: "0"
    },
    async onEnable(context) {
        await context.store.put(TRIGGER_DATA_STORE_KEY, Date.now() - (60 * 60 * 1000), StoreScope.FLOW);
        console.log('Polling trigger enabled. Initial last processed timestamp set.');
    },
    async onDisable(context) {
        console.log('Polling trigger disabled.');
    },
    async run(context) {
        const { accountId, folderId } = context.propsValue;
        const accessToken = context.auth.access_token;
        const authProps = context.auth as TriggerAuthProps;
        const apiUrl = getZohoMailApiUrl(authProps.data_center);
        const lastProcessedTimestamp = await context.store.get<number>(TRIGGER_DATA_STORE_KEY, StoreScope.FLOW) || 0;

        const queryParams: QueryParams = {
            status: 'all',
            sortBy: 'date',
            sortorder: 'false',
            limit: '50',
            // As per API docs, toAddress needs includeto=true to be returned by messages/view
            includeto: 'true',
        };
        if (folderId && folderId !== '') {
            queryParams['folderId'] = folderId as string;
        }

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${apiUrl}/accounts/${accountId}/messages/view`,
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
            queryParams,
        });

        let newEmails: ZohoEmail[] = [];
        let maxTimestampInBatch = lastProcessedTimestamp;

        if (response.status === 200 && response.body.data) {
            const emails = response.body.data;
            newEmails = emails.filter(email => {
                const emailTimestamp = email.receivedTime ? parseInt(email.receivedTime, 10) : 0;
                return emailTimestamp > lastProcessedTimestamp;
            });

            newEmails.sort((a, b) => {
                const timeA = a.receivedTime ? parseInt(a.receivedTime, 10) : 0;
                const timeB = b.receivedTime ? parseInt(b.receivedTime, 10) : 0;
                return timeA - timeB;
            });

            if (newEmails.length > 0) {
                maxTimestampInBatch = newEmails.reduce((max, email) => {
                    const currentTs = email.receivedTime ? parseInt(email.receivedTime, 10) : 0;
                    return currentTs > max ? currentTs : max;
                }, lastProcessedTimestamp);
            } else if (emails.length > 0) {
                 maxTimestampInBatch = emails.reduce((max, email) => {
                    const currentTs = email.receivedTime ? parseInt(email.receivedTime, 10) : 0;
                    return currentTs > max ? currentTs : max;
                }, lastProcessedTimestamp);
            }
        }

        if (maxTimestampInBatch > lastProcessedTimestamp) {
            await context.store.put(TRIGGER_DATA_STORE_KEY, maxTimestampInBatch, StoreScope.FLOW);
        }

        return newEmails;
    },
    async test(context) {
        const { accountId, folderId } = context.propsValue;
        const accessToken = context.auth.access_token;
        const authProps = context.auth as TriggerAuthProps;
        const apiUrl = getZohoMailApiUrl(authProps.data_center);

        const queryParams: QueryParams = {
            status: 'all',
            sortBy: 'date',
            sortorder: 'false',
            limit: '5',
            includeto: 'true',
        };
        if (folderId && folderId !== '') {
            queryParams['folderId'] = folderId as string;
        }

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${apiUrl}/accounts/${accountId}/messages/view`,
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
            queryParams,
        });
        return response.body?.data?.slice(0, 5) || []; // Return up to 5 emails for sample
    },
});
