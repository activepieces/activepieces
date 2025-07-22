
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface ContactData {
    id: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    cellPhone?: string;
    address?: string;
    city?: string;
    country?: string;
    company?: string;
    position?: string;
    canReceiveEmails?: boolean;
    canReceiveSmsMessages?: boolean;
    ipSignup?: string;
    timestampSignup?: string;
    lastChanged?: string;
    deleted?: boolean;
    joinSource?: string;
    listAssociationTime?: string;
    c_DaysSinceSignup?: number;
    campaignSource?: string;
    externalId?: string;
    dateOfBirth?: string;
    lists_Linked?: number[];
    customFields?: Record<string, any>;
    unsubscribeReasonType?: string;
    unsubscribeReasonComment?: string;
    timestampUnsubscribed?: string;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, {
    fields?: string;
    includeCustomFields?: boolean;
    includeLinkedLists?: boolean;
    joinSourceFilter?: string;
    sortBy?: string;
    maxItems?: number;
}> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        try {
            const { 
                fields, 
                includeCustomFields = false, 
                includeLinkedLists = false,
                joinSourceFilter,
                sortBy = '-timestampSignup',
                maxItems = 100
            } = propsValue;
            
            const queryParams: string[] = [];
            
            if (fields && fields.trim()) {
                queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
            } else {
                queryParams.push('fields=id,email,firstName,lastName,timestampSignup,joinSource,lastChanged,canReceiveEmails,campaignSource,ipSignup');
            }
            
            if (includeCustomFields) {
                queryParams.push('includeCustomFields=true');
            }
            if (includeLinkedLists) {
                queryParams.push('includeLinkedLists=true');
            }
            
            queryParams.push(`sort=${encodeURIComponent(sortBy)}`);
            
            queryParams.push('skip=0');
            queryParams.push(`take=${Math.min(maxItems, 100)}`);
            
            const endpoint = `/Contacts?${queryParams.join('&')}`;
            
            const response = await makeRequest(auth, HttpMethod.GET, endpoint);
            
            if (!response) {
                return [];
            }
            
            const items: ContactData[] = Array.isArray(response) ? response : [response];
            
            const newSubscribers = items.filter(item => {
                if (!item.timestampSignup) return false;
                
                const signupTime = new Date(item.timestampSignup).getTime();
                const isNew = signupTime > (lastFetchEpochMS ?? 0);
                
                if (joinSourceFilter && joinSourceFilter !== 'All' && item.joinSource !== joinSourceFilter) {
                    return false;
                }
                
                return isNew;
            });
            
            const sortedSubscribers = newSubscribers
                .sort((a, b) => new Date(b.timestampSignup || 0).getTime() - new Date(a.timestampSignup || 0).getTime());
            
            return sortedSubscribers.map(item => ({
                epochMilliSeconds: new Date(item.timestampSignup || 0).getTime(),
                data: {
                    id: item.id?.toString(),
                    email: item.email,
                    firstName: item.firstName,
                    lastName: item.lastName,
                    phone: item.phone,
                    cellPhone: item.cellPhone,
                    
                    address: item.address,
                    city: item.city,
                    country: item.country,
                    company: item.company,
                    position: item.position,
                    dateOfBirth: item.dateOfBirth,
                    externalId: item.externalId,
                    
                    canReceiveEmails: item.canReceiveEmails,
                    canReceiveSmsMessages: item.canReceiveSmsMessages,
                    
                    ipSignup: item.ipSignup,
                    timestampSignup: item.timestampSignup,
                    joinSource: item.joinSource,
                    campaignSource: item.campaignSource,
                    
                    lastChanged: item.lastChanged,
                    listAssociationTime: item.listAssociationTime,
                    c_DaysSinceSignup: item.c_DaysSinceSignup,
                    
                    deleted: item.deleted,
                    
                    ...(includeLinkedLists && item.lists_Linked ? { lists_Linked: item.lists_Linked } : {}),
                    ...(includeCustomFields && item.customFields ? { customFields: item.customFields } : {}),
                    
                    ...(item.unsubscribeReasonType ? { 
                        unsubscribeReasonType: item.unsubscribeReasonType,
                        unsubscribeReasonComment: item.unsubscribeReasonComment,
                        timestampUnsubscribed: item.timestampUnsubscribed
                    } : {}),
                    
                    triggerInfo: {
                        detectedAt: new Date().toISOString(),
                        source: 'smoove',
                        type: 'new_subscriber',
                        joinSource: item.joinSource,
                        daysSinceSignup: item.c_DaysSinceSignup || 0
                    }
                }
            }));
            
        } catch (error: any) {
            console.error('Error fetching new subscribers:', error);
            return [];
        }
    }
};

export const newSubscriber = createTrigger({
    auth: smooveAuth,
    name: 'newSubscriber',
    displayName: 'New Subscriber',
    description: 'Fires when a new subscriber is added to your Smoove account',
    props: {
        fields: Property.ShortText({
            displayName: 'Fields to Include',
            description: 'Comma-separated fields to include (e.g., id,email,firstName,lastName,timestampSignup). Leave empty for default fields.',
            required: false,
            defaultValue: 'id,email,firstName,lastName,timestampSignup,joinSource,campaignSource,canReceiveEmails,ipSignup'
        }),
        includeCustomFields: Property.Checkbox({
            displayName: 'Include Custom Fields',
            description: 'Include custom field data in subscriber information',
            required: false,
            defaultValue: false
        }),
        includeLinkedLists: Property.Checkbox({
            displayName: 'Include Linked Lists',
            description: 'Include list associations in subscriber information',
            required: false,
            defaultValue: false
        }),
        joinSourceFilter: Property.StaticDropdown({
            displayName: 'Join Source Filter',
            description: 'Filter subscribers by how they joined (leave as "All" to monitor all sources)',
            required: false,
            defaultValue: 'All',
            options: {
                options: [
                    { label: 'All Sources', value: 'All' },
                    { label: 'Unknown', value: 'Unknown' },
                    { label: 'Manual Entry', value: 'ByHand' },
                    { label: 'Import', value: 'Import' },
                    { label: 'Facebook', value: 'FaceBook' },
                    { label: 'API', value: 'API' },
                    { label: 'Landing Page', value: 'LandingPage' },
                    { label: 'Embed Form', value: 'Embed' },
                    { label: 'Popup', value: 'Popup' },
                    { label: 'QR Code', value: 'QR' },
                    { label: 'SMS', value: 'SMS' },
                    { label: 'WhatsApp', value: 'Whatsapp' },
                    { label: 'Form', value: 'Form' },
                    { label: 'Automation', value: 'Automation' }
                ]
            }
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'How to sort contacts for monitoring new subscribers',
            required: false,
            defaultValue: '-timestampSignup',
            options: {
                options: [
                    { label: 'Newest Signups First', value: '-timestampSignup' },
                    { label: 'Oldest Signups First', value: 'timestampSignup' },
                    { label: 'Recently Changed First', value: '-lastChanged' },
                    { label: 'ID (Newest First)', value: '-id' },
                    { label: 'Email (A-Z)', value: 'email' }
                ]
            }
        }),
        maxItems: Property.Number({
            displayName: 'Max Items to Check',
            description: 'Maximum number of contacts to check for new subscribers (1-100)',
            required: false,
            defaultValue: 100
        })
    },
    sampleData: {
        "id": "845986993",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "cellPhone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "country": "United States",
        "company": "Tech Corp",
        "position": "Marketing Manager",
        "dateOfBirth": "1990-05-15T00:00:00Z",
        "externalId": "ext_12345",
        "canReceiveEmails": true,
        "canReceiveSmsMessages": true,
        "ipSignup": "192.168.1.100",
        "timestampSignup": "2025-01-22T14:30:00Z",
        "joinSource": "LandingPage",
        "campaignSource": "winter-campaign-2025",
        "lastChanged": "2025-01-22T14:30:00Z",
        "listAssociationTime": "2025-01-22T14:30:00Z",
        "c_DaysSinceSignup": 0,
        "deleted": false,
        "lists_Linked": [5556, 8886],
        "customFields": {
            "industry": "Technology",
            "lead_score": 85,
            "interests": ["email marketing", "automation"]
        },
        "triggerInfo": {
            "detectedAt": "2025-01-22T14:35:00Z",
            "source": "smoove",
            "type": "new_subscriber",
            "joinSource": "LandingPage",
            "daysSinceSignup": 0
        }
    },
    type: TriggerStrategy.POLLING,
    
    async test(context) {
        try {
            const response = await makeRequest(context.auth, HttpMethod.GET, '/Contacts?take=1&sort=-timestampSignup');
            const item = Array.isArray(response) ? response[0] : response;
            
            if (!item) {
                throw new Error('No subscribers found to test with');
            }
            
            return [{
                id: item.id?.toString(),
                email: item.email,
                firstName: item.firstName,
                lastName: item.lastName,
                phone: item.phone,
                cellPhone: item.cellPhone,
                timestampSignup: item.timestampSignup,
                joinSource: item.joinSource,
                campaignSource: item.campaignSource,
                canReceiveEmails: item.canReceiveEmails,
                canReceiveSmsMessages: item.canReceiveSmsMessages,
                triggerInfo: {
                    detectedAt: new Date().toISOString(),
                    source: 'smoove',
                    type: 'new_subscriber_test',
                }
            }];
        } catch (error) {
            throw new Error('Unable to test trigger - please check your API connection');
        }
    },
    
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});