import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { zohoMailAuth } from '../../index';
import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

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

const TRIGGER_SEARCH_DATA_STORE_KEY = 'new_email_search_last_processed_timestamp';
const ZOHO_MAIL_API_URL = 'https://mail.zoho.';

async function fetchAccounts(auth: OAuth2PropertyValue) {
  const typedAuth = auth as any;
  const region = typedAuth.props?.region;
  const accessToken = typedAuth.access_token;
  
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${ZOHO_MAIL_API_URL}${region}/api/accounts`,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    if (response.status === 200 && response.body.data) {
      return response.body.data.map((account: any) => ({
        label: account.displayName || account.emailAddress,
        value: account.accountId,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Zoho Mail accounts:', error);
    return [];
  }
}

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
                const accounts = await fetchAccounts(auth as OAuth2PropertyValue);
                if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
                return { disabled: false, options: accounts };
            },
        }),
        searchCriteria: Property.ShortText({
            displayName: 'Search Criteria',
            description: 'Search for emails containing this text in subject or body.',
            required: true,
        }),
        fromAddress: Property.ShortText({
            displayName: 'From Address',
            description: 'Filter emails from this sender (optional).',
            required: false,
        }),
        hasAttachment: Property.Checkbox({
            displayName: 'Has Attachment',
            description: 'Filter emails with attachments.',
            required: false,
            defaultValue: false,
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
        folderId: "Inbox",
        status: "1",
        hasAttachment: "0"
    },
    async onEnable(context) {
        await context.store.put(TRIGGER_SEARCH_DATA_STORE_KEY, Date.now() - (60 * 60 * 1000), StoreScope.FLOW);
        console.log('Search polling trigger enabled. Initial last processed timestamp set.');
    },
    async onDisable(context) {
        console.log('Search polling trigger disabled.');
    },
    async run(context) {
        const { accountId, searchCriteria, fromAddress, hasAttachment } = context.propsValue;
        const accessToken = context.auth.access_token;
        const typedAuth = context.auth as any;
        const region = typedAuth.props?.region;
        const lastProcessedTimestamp = await context.store.get<number>(TRIGGER_SEARCH_DATA_STORE_KEY, StoreScope.FLOW) || 0;

        let searchQuery = searchCriteria;
        if (fromAddress) {
            searchQuery += ` from:${fromAddress}`;
        }
        if (hasAttachment) {
            searchQuery += ` has:attachment`;
        }

        const queryParams: QueryParams = {
            searchKey: searchQuery,
            status: 'all',
            sortBy: 'date',
            sortorder: 'false',
            limit: '50',
            includeto: 'true',
        };

        const response = await httpClient.sendRequest<ListEmailsResponse>({
            method: HttpMethod.GET,
            url: `${ZOHO_MAIL_API_URL}${region}/api/accounts/${accountId}/messages/search`,
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
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
            await context.store.put(TRIGGER_SEARCH_DATA_STORE_KEY, maxTimestampInBatch, StoreScope.FLOW);
        }

        return newEmails;
    },
});