
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface LandingPageData {
    formId: number;
    formTitle: string;
    formType: string;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, { formType?: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue }) => {
        try {
            let endpoint = '/LandingPages';
            const { formType } = propsValue;
            
            if (formType && formType !== 'All') {
                endpoint += `?type=${encodeURIComponent(formType)}`;
            }

            const response = await makeRequest(auth, HttpMethod.GET, endpoint);
            
            if (!response) {
                return [];
            }
            
            const items: LandingPageData[] = Array.isArray(response) ? response : [response];

            const validItems = items
                .filter(item => item.formId && item.formTitle)
                .sort((a, b) => (b.formId || 0) - (a.formId || 0));

            return validItems.map(item => {
                const { formId, formTitle, formType, ...otherFields } = item;
                return {
                    id: formId.toString(),
                    data: {
                        formId,
                        formTitle,
                        formType: formType || 'Unknown',
                        ...otherFields
                    },
                };
            });
            
        } catch (error: any) {
            console.error('Error fetching landing pages:', error);
            return [];
        }
    }
};

export const newFormCreated = createTrigger({
    auth: smooveAuth,
    name: 'newFormCreated',
    displayName: 'New Form Created',
    description: 'Fires when a new form/landing page is created in your Smoove account',
    props: {
        formType: Property.StaticDropdown({
            displayName: 'Form Type Filter',
            description: 'Filter by specific form type, or select "All" to monitor all form types',
            required: false,
            defaultValue: 'All',
            options: {
                options: [
                    { label: 'All Types', value: 'All' },
                    { label: 'Landing Page', value: 'LandingPage' },
                    { label: 'Facebook Form', value: 'Facebook' },
                    { label: 'Mobile Form', value: 'Mobile' },
                    { label: 'Embed Form', value: 'Embed' },
                    { label: 'Popup Form', value: 'Popup' }
                ]
            }
        })
    },
    sampleData: {
        "formId": 581014,
        "formTitle": "Contact Us Landing Page",
        "formType": "LandingPage",
        "dateCreated": "2025-01-22T10:30:00Z",
        "isActive": true,
        "url": "https://example.smoove.io/landing/contact-us",
        "description": "Main contact form for lead generation",
        "fields": [
            {
                "name": "email",
                "type": "email",
                "required": true
            },
            {
                "name": "firstName", 
                "type": "text",
                "required": true
            },
            {
                "name": "phone",
                "type": "tel",
                "required": false
            }
        ]
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