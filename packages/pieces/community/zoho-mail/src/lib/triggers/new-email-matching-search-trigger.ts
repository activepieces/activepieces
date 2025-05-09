import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zohoMailAuth } from '../../index';
import { fetchAccounts, getZohoMailApiUrl } from '../common'; // Import getZohoMailApiUrl, remove ZOHO_MAIL_API_URL
import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

// Define a local type for auth props
interface TriggerAuthProps extends OAuth2PropertyValue {
  data_center: string; // Stores the domain string e.g., 'com', 'eu'
}

// Using the same ZohoEmail and ListEmailsResponse interfaces as new-email-received-trigger
// as the search endpoint seems to return a similar data structure.
interface ZohoEmail {
    messageId: string;
    subject?: string;
    fromAddress?: string;
    toAddress?: string;
    ccAddress?: string;
    summary?: string;
    receivedTime?: string;
    receivedtime?: string; // API response for search uses lowercase 'receivedtime'
    sentDateInGMT?: string;
    status?: string;
    hasAttachment?: number | string; // Can be 0/1 or "0"/"1"
    folderId?: string | number;
    threadId?: string | number;
    size?: string | number;
    priority?: number;
    flagid?: number | string;
    hasInline?: string | boolean;
    threadCount?: number | string;
    sender?: string; // search response also has a sender field
    URI?: string; // search response has URI
    status2?: string; // search response has status2
}

interface ListEmailsResponse {
    status: { code: number; description: string; };
    data: ZohoEmail[];
}

const TRIGGER_SEARCH_DATA_STORE_KEY = 'new_email_search_last_processed_timestamp';

export const newEmailMatchingSearch = createTrigger({
    auth: zohoMailAuth,
    name: 'new_email_matching_search',
    displayName: 'New Email Matching Search',
    description: 'Triggers when a new email matches specified search criteria.',
    props: {
        accountId: Property.Dropdown({
            displayName: 'Account ID',
            description: 'Select the Zoho Mail Account ID.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const accounts = await fetchAccounts(auth as TriggerAuthProps); // Use TriggerAuthProps
                if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
                return { disabled: false, options: accounts };
            },
        }),
        searchKey: Property.ShortText({
            displayName: 'Search Query',
            description: 'The search criteria (e.g., subject:invoice, from:user@example.com). Refer to Zoho Mail search syntax.',
            required: true,
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        messageId: "9000000019029",
        subject: "Marketing Strategy",
        fromAddress: "rebecca@zylker.com",
        sender: "Maria Daniel",
        receivedtime: "1425388373920",
        folderId: "9000000000905",
        status: "read",
        hasAttachment: 0
    },
    async onEnable(context) {
        await context.store.put(TRIGGER_SEARCH_DATA_STORE_KEY, Date.now() - (60 * 60 * 1000), StoreScope.FLOW);
        console.log('Search polling trigger enabled. Initial last processed timestamp set.');
    },
    async onDisable(context) {
        console.log('Search polling trigger disabled.');
    },
    async run(context) {
        const { accountId, searchKey } = context.propsValue;
        const accessToken = context.auth.access_token;
        const authProps = context.auth as TriggerAuthProps; // Get auth props
        const apiUrl = getZohoMailApiUrl(authProps.data_center); // Get dynamic API URL
        const lastProcessedTimestamp = await context.store.get<number>(TRIGGER_SEARCH_DATA_STORE_KEY, StoreScope.FLOW) || 0;

        const queryParams: QueryParams = {
            searchKey: searchKey as string,
            // receivedTime: lastProcessedTimestamp.toString(), // API expects time *before* which emails were received
            // For polling new items, we usually want items *after* a certain point.
            // The search API's receivedTime is for filtering *older* emails.
            // So, we fetch recent ones and then filter by our stored lastProcessedTimestamp.
            // Let API default for `receivedTime` to get recent items, then filter locally.
            limit: '50',
            includeto: 'true',
        };

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${apiUrl}/accounts/${accountId}/messages/search`, // Use dynamic apiUrl
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
                // The search API sample response uses `receivedtime` (lowercase t)
                const emailTimestampStr = email.receivedtime || email.receivedTime;
                const emailTimestamp = emailTimestampStr ? parseInt(emailTimestampStr, 10) : 0;
                return emailTimestamp > lastProcessedTimestamp;
            });

            newEmails.sort((a, b) => {
                const timeAStr = a.receivedtime || a.receivedTime;
                const timeBStr = b.receivedtime || b.receivedTime;
                const timeA = timeAStr ? parseInt(timeAStr, 10) : 0;
                const timeB = timeBStr ? parseInt(timeBStr, 10) : 0;
                return timeA - timeB;
            });

            if (newEmails.length > 0) {
                maxTimestampInBatch = newEmails.reduce((max, email) => {
                    const currentTsStr = email.receivedtime || email.receivedTime;
                    const currentTs = currentTsStr ? parseInt(currentTsStr, 10) : 0;
                    return currentTs > max ? currentTs : max;
                }, lastProcessedTimestamp);
            } else if (emails.length > 0) {
                 maxTimestampInBatch = emails.reduce((max, email) => {
                    const currentTsStr = email.receivedtime || email.receivedTime;
                    const currentTs = currentTsStr ? parseInt(currentTsStr, 10) : 0;
                    return currentTs > max ? currentTs : max;
                }, lastProcessedTimestamp);
            }
        }

        if (maxTimestampInBatch > lastProcessedTimestamp) {
            await context.store.put(TRIGGER_SEARCH_DATA_STORE_KEY, maxTimestampInBatch, StoreScope.FLOW);
        }

        return newEmails;
    },
    async test(context) {
        const { accountId, searchKey } = context.propsValue;
        const accessToken = context.auth.access_token;
        const authProps = context.auth as TriggerAuthProps; // Get auth props
        const apiUrl = getZohoMailApiUrl(authProps.data_center); // Get dynamic API URL

        const queryParams: QueryParams = {
            searchKey: searchKey as string,
            limit: '5',
            includeto: 'true',
        };

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${apiUrl}/accounts/${accountId}/messages/search`, // Use dynamic apiUrl
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
            queryParams,
        });
        return response.body?.data?.slice(0,5) || [];
    },
});
