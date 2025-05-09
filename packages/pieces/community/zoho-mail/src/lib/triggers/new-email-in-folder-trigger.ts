import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zohoMailAuth } from '../../index';
import { ZOHO_MAIL_API_URL, fetchAccounts, fetchFolders } from '../common';
import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

// Using the same ZohoEmail and ListEmailsResponse interfaces
interface ZohoEmail {
    messageId: string;
    subject?: string;
    fromAddress?: string;
    toAddress?: string;
    ccAddress?: string;
    summary?: string;
    receivedTime?: string;
    sentDateInGMT?: string;
    status?: string;
    hasAttachment?: string;
    folderId?: string;
    threadId?: string;
    size?: string;
    priority?: string;
    flagid?: string;
    hasInline?: string;
    threadCount?: string;
}

interface ListEmailsResponse {
    status: { code: number; description: string; };
    data: ZohoEmail[];
}

const TRIGGER_FOLDER_DATA_STORE_KEY = 'new_email_folder_last_processed_timestamp';

export const newEmailInFolder = createTrigger({
    auth: zohoMailAuth,
    name: 'new_email_in_folder',
    displayName: 'New Email in Folder',
    description: 'Triggers when a new email is received in a specific folder.',
    props: {
        accountId: Property.Dropdown({
            displayName: 'Account ID',
            description: 'Select the Zoho Mail Account ID.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const accounts = await fetchAccounts(auth as OAuth2PropertyValue);
                if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
                return { disabled: false, options: accounts };
            },
        }),
        folderId: Property.Dropdown({
            displayName: 'Folder',
            description: 'Select the folder to watch.',
            required: true, // Made mandatory
            refreshers: ['accountId'],
            options: async ({ auth, accountId }) => {
                if (!auth || !accountId) return { disabled: true, placeholder: 'Select an account first', options: [] };
                const folders = await fetchFolders(auth as OAuth2PropertyValue, accountId as string);
                 if (folders.length === 0) return { disabled: true, placeholder: 'No folders found for this account', options: [] };
                return { disabled: false, options: folders };
            },
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        messageId: "1709887058769100001",
        subject: "Re: Hello ",
        fromAddress: "rebecca@zylker.com",
        toAddress: "paul@zylker.com",
        receivedTime: "1709887053409",
        sentDateInGMT: "1709867251000",
        summary: "reply test",
        folderId: "9000000002014", // This will be the selected folder
        status: "1",
        hasAttachment: "0"
    },
    async onEnable(context) {
        await context.store.put(TRIGGER_FOLDER_DATA_STORE_KEY, Date.now() - (60 * 60 * 1000), StoreScope.FLOW);
        console.log('Folder polling trigger enabled. Initial last processed timestamp set.');
    },
    async onDisable(context) {
        console.log('Folder polling trigger disabled.');
    },
    async run(context) {
        const { accountId, folderId } = context.propsValue;
        const accessToken = context.auth.access_token;
        const lastProcessedTimestamp = await context.store.get<number>(TRIGGER_FOLDER_DATA_STORE_KEY, StoreScope.FLOW) || 0;

        const queryParams: QueryParams = {
            folderId: folderId as string, // folderId is now mandatory
            status: 'all',
            sortBy: 'date',
            sortorder: 'false',
            limit: '50',
            includeto: 'true',
        };

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/messages/view`,
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
            await context.store.put(TRIGGER_FOLDER_DATA_STORE_KEY, maxTimestampInBatch, StoreScope.FLOW);
        }

        return newEmails;
    },
    async test(context) {
        const { accountId, folderId } = context.propsValue;
        const accessToken = context.auth.access_token;

        const queryParams: QueryParams = {
            folderId: folderId as string,
            status: 'all',
            sortBy: 'date',
            sortorder: 'false',
            limit: '5',
            includeto: 'true',
        };

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/messages/view`,
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
            queryParams,
        });
        return response.body?.data?.slice(0,5) || [];
    },
});
