
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { LandingPageIdDropdown } from '../common/props';

interface LeadSubmission {
    id: number;
    contactId: number;
    pageUrl: string;
    userIP: string;
    timeStamp: string;
    contact: {
        id: number;
        email: string;
        firstName?: string;
        lastName?: string;
        cellPhone?: string;
        timestampSignup: string;
        externalId?: string;
    };
    formId?: number;
    formType?: string;
    customFields?: Record<string, any>;
}

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, any> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        try {
            const { 
                monitoringMode, 
                landingPageId, 
                includeCustomFields = false, 
                includeContactDetails = true 
            } = propsValue;
            
            let allSubmissions: LeadSubmission[] = [];
            
            if (monitoringMode === 'specific' && landingPageId) {
                const submissions = await fetchSubmissionsForPage(
                    auth, 
                    landingPageId as string, 
                    includeCustomFields, 
                    includeContactDetails,
                    lastFetchEpochMS
                );
                allSubmissions = submissions;
                
            } else if (monitoringMode === 'all') {
                try {
                    const landingPages = await makeRequest(auth, HttpMethod.GET, '/LandingPages');
                    const pages = Array.isArray(landingPages) ? landingPages : [];
                    
                    const pagePromises = pages.slice(0, 10).map(async (page: any) => {
                        if (page.formId) {
                            return await fetchSubmissionsForPage(
                                auth, 
                                page.formId.toString(), 
                                includeCustomFields, 
                                includeContactDetails,
                                lastFetchEpochMS
                            );
                        }
                        return [];
                    });
                    
                    const allPageSubmissions = await Promise.all(pagePromises);
                    allSubmissions = allPageSubmissions.flat();
                    
                } catch (error) {
                    console.error('Error fetching all landing pages:', error);
                    return [];
                }
            }
            
            const uniqueSubmissions = allSubmissions
                .filter((submission, index, self) => 
                    index === self.findIndex(s => s.id === submission.id)
                )
                .sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime());
                
            return uniqueSubmissions.map(submission => ({
                epochMilliSeconds: new Date(submission.timeStamp).getTime(),
                data: submission
            }));
            
        } catch (error: any) {
            console.error('Error fetching lead submissions:', error);
            return [];
        }
    }
};

async function fetchSubmissionsForPage(
    auth: string, 
    pageId: string, 
    includeCustomFields: boolean,
    includeContactDetails: boolean,
    lastFetchEpochMS?: number
): Promise<LeadSubmission[]> {
    try {
        const queryParams = [
            'fields=id,email,timestampSignup,firstName,lastName,cellPhone,externalId',
            'page=1',
            'itemsPerPage=100',
            `includeCustomFields=${includeCustomFields}`,
            'includeLinkedLists=false'
        ];
        
        const endpoint = `/LandingPages/${pageId}/Recipients?${queryParams.join('&')}`;
        const response = await makeRequest(auth, HttpMethod.GET, endpoint);
        
        if (!response) return [];
        
        const items = Array.isArray(response) ? response : [response];
        
        const newSubmissions = items.filter((item: any) => {
            if (!item.timestampSignup) return false;
            const submissionTime = new Date(item.timestampSignup).getTime();
            return submissionTime > (lastFetchEpochMS ?? 0);
        });
        
        return newSubmissions.map((item: any) => ({
            id: item.id || Date.now(),
            contactId: item.id,
            pageUrl: `https://lp.smoove.io/form/${pageId}`,
            userIP: item.ipSignup || 'Unknown',
            timeStamp: item.timestampSignup,
            contact: {
                id: item.id,
                email: item.email,
                firstName: item.firstName,
                lastName: item.lastName,
                cellPhone: item.cellPhone,
                timestampSignup: item.timestampSignup,
                externalId: item.externalId
            },
            formId: parseInt(pageId),
            formType: 'LandingPage',
            ...(includeCustomFields && item.customFields ? { customFields: item.customFields } : {})
        }));
        
    } catch (error: any) {
        console.error(`Error fetching submissions for page ${pageId}:`, error);
        return [];
    }
}

export const newLeadSubmitted = createTrigger({
    auth: smooveAuth,
    name: 'newLeadSubmitted',
    displayName: 'New Lead Submitted',
    description: 'Fires when a lead submits via form, popup, or mobile campaign',
    props: {
        monitoringMode: Property.StaticDropdown({
            displayName: 'Monitoring Mode',
            description: 'Choose whether to monitor all forms or a specific form',
            required: true,
            defaultValue: 'all',
            options: {
                options: [
                    { label: 'All Forms/Landing Pages', value: 'all' },
                    { label: 'Specific Form/Landing Page', value: 'specific' }
                ]
            }
        }),
        landingPageId: LandingPageIdDropdown,
        includeCustomFields: Property.Checkbox({
            displayName: 'Include Custom Fields',
            description: 'Include custom field data in the lead submission',
            required: false,
            defaultValue: false
        }),
        includeContactDetails: Property.Checkbox({
            displayName: 'Include Full Contact Details',
            description: 'Include complete contact information in the submission data',
            required: false,
            defaultValue: true
        })
    },
    sampleData: {
        "id": 965381765,
        "contactId": 845986993,
        "pageUrl": "https://lp.smoove.io/form/581014",
        "userIP": "180.151.116.12",
        "timeStamp": "2025-01-22T18:41:48.747Z",
        "formId": 581014,
        "formType": "LandingPage",
        "contact": {
            "id": 845986993,
            "email": "john.doe@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "cellPhone": "+1234567890",
            "timestampSignup": "2025-01-22T18:41:48.747Z",
            "externalId": "ext_12345"
        },
        "customFields": {
            "company": "Tech Corp",
            "interests": ["marketing", "automation"],
            "lead_score": 85
        }
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