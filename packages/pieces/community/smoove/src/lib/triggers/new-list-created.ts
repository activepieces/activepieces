
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface ListData {
    id: number;
    name?: string;
    publicName?: string;
    description?: string;
    publicDescription?: string;
    permissions?: {
        isPublic?: boolean;
        allowsUsersToSubscribe?: boolean;
        allowsUsersToUnsubscribe?: boolean;
        isPortal?: boolean;
    };
    contactsCount?: number;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, {
    fields?: string;
    sortBy?: string;
    maxItems?: number;
}> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue }) => {
        try {
            const { fields, sortBy, maxItems = 50 } = propsValue;
            
            const queryParams: string[] = [];
            
            if (fields && fields.trim()) {
                queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
            }
            
            if (sortBy) {
                queryParams.push(`sort=${encodeURIComponent(sortBy)}`);
            }
            
            queryParams.push('skip=0');
            queryParams.push(`take=${Math.min(maxItems, 100)}`);
            
            const endpoint = `/Lists${queryParams.length ? '?' + queryParams.join('&') : ''}`;
            
            const response = await makeRequest(auth, HttpMethod.GET, endpoint);
            
            if (!response) {
                return [];
            }
            
            const items: ListData[] = Array.isArray(response) ? response : [response];
            
            const validItems = items
                .filter(item => item.id)
                .sort((a, b) => (b.id || 0) - (a.id || 0));
            
            return validItems.map(item => ({
                id: item.id.toString(),
                data: item,
            }));
            
        } catch (error: any) {
            console.error('Error fetching lists:', error);
            return [];
        }
    }
};

export const newListCreated = createTrigger({
    auth: smooveAuth,
    name: 'newListCreated',
    displayName: 'New List Created',
    description: 'Fires when a new mailing list is created in your Smoove account',
    props: {
        fields: Property.ShortText({
            displayName: 'Fields to Include',
            description: 'Comma-separated list of fields to include (e.g., id,name,description,contactsCount). Leave empty for all fields.',
            required: false,
            defaultValue: 'id,name,description,publicName,contactsCount,permissions'
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'How to sort the lists for monitoring',
            required: false,
            defaultValue: '-id',
            options: {
                options: [
                    { label: 'Newest First (by ID)', value: '-id' },
                    { label: 'Oldest First (by ID)', value: 'id' },
                    { label: 'Name (A-Z)', value: 'name' },
                    { label: 'Name (Z-A)', value: '-name' }
                ]
            }
        }),
        maxItems: Property.Number({
            displayName: 'Max Lists to Monitor',
            description: 'Maximum number of lists to check for new additions (1-100)',
            required: false,
            defaultValue: 50
        })
    },
    sampleData: {
        "id": 173584,
        "name": "Welcome Series Subscribers",
        "description": "Automated welcome email series for new signups",
        "publicName": "Welcome Series",
        "publicDescription": "Join our welcome series to get started with our platform",
        "permissions": {
            "isPublic": true,
            "allowsUsersToSubscribe": true,
            "allowsUsersToUnsubscribe": true,
            "isPortal": false
        },
        "contactsCount": 0,
        "dateCreated": "2025-01-22T14:30:00Z",
        "isActive": true,
        "tags": ["welcome", "automation", "new-users"]
    },
    type: TriggerStrategy.POLLING,
    
    async test(context) {
        const results = await pollingHelper.test(polling, context);
        return results;
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