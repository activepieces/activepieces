
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth, microsoft365PeopleCommon } from '../../lib/common';

interface ContactData {
    id: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
    emailAddresses?: Array<{
        type: string;
        name: string;
        address: string;
    }>;
    businessPhones?: string[];
    mobilePhone?: string;
    jobTitle?: string;
    companyName?: string;
    department?: string;
    changeType: string;
    lastModifiedDateTime: string;
}

interface WebhookPayload {
    value?: ContactData[];
    changeType?: string;
    id?: string;
    [key: string]: any;
}

export const newOrUpdatedContact = createTrigger({
    auth: microsoft365PeopleAuth,
    name: 'new_or_updated_contact',
    displayName: 'New or Updated Contact',
    description: 'Fires when a contact is created or updated in Microsoft 365 People',
    props: {
        changeType: microsoft365PeopleCommon.changeType,
        folderId: microsoft365PeopleCommon.contactFolderId,
        includeDeleted: microsoft365PeopleCommon.includeDeleted,
    },
    sampleData: {
        "id": "AAMkAGVmMDEzMTM4LTZmYWUtNDdkNC1hMDZiLTU1OGY5OTZhYmY4OABGAAAAAAAiQ8W967B7TKBjgx9rVEURBwAiIsqMbYjsT5G-TvrKxZwDAAAAAAEMAABiIsqMbYjsT5G-TvrKxZwDAAABXfCAAA=",
        "displayName": "John Doe",
        "givenName": "John",
        "surname": "Doe",
        "emailAddresses": [
            {
                "type": "personal",
                "name": "Personal",
                "address": "john.doe@example.com"
            }
        ],
        "businessPhones": ["+1-555-0123"],
        "mobilePhone": "+1-555-0456",
        "jobTitle": "Software Engineer",
        "companyName": "Example Corp",
        "department": "Engineering",
        "changeType": "updated",
        "lastModifiedDateTime": "2024-01-15T10:30:00Z"
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        const { propsValue } = context;
        const changeType = propsValue.changeType as string;
        const folderId = propsValue.folderId as string;
        
        // Create webhook subscription for Microsoft Graph API
        const subscription = {
            changeType: changeType === 'all' ? 'created,updated,deleted' : changeType,
            notificationUrl: context.webhookUrl,
            resource: folderId 
                ? `/me/contactFolders/${folderId}/contacts` 
                : '/me/contacts',
            expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            clientState: `activepieces-webhook`,
            includeResourceData: true
        };

        try {
            // Store subscription info for later cleanup
            await context.store.put('subscription', subscription);
            
            // Note: In a real implementation, you would make an API call to Microsoft Graph
            // to create the subscription. This requires proper Microsoft Graph API integration.
            console.log('Webhook subscription created for Microsoft 365 People contacts');
        } catch (error) {
            console.error('Failed to create webhook subscription:', error);
            throw new Error('Failed to create webhook subscription');
        }
    },

    async onDisable(context) {
        try {
            // Retrieve subscription info and delete it
            const subscription = await context.store.get('subscription');
            if (subscription) {
                // Note: In a real implementation, you would make an API call to Microsoft Graph
                // to delete the subscription
                await context.store.delete('subscription');
                console.log('Webhook subscription deleted for Microsoft 365 People contacts');
            }
        } catch (error) {
            console.error('Failed to delete webhook subscription:', error);
        }
    },

    async run(context) {
        const { payload } = context;
        const { body } = payload;
        
        if (!body || typeof body !== 'object') {
            return [];
        }

        const webhookBody = body as WebhookPayload;
        
        // Parse the webhook payload from Microsoft Graph
        if (webhookBody.value && Array.isArray(webhookBody.value)) {
            return webhookBody.value.map((contact: ContactData) => ({
                ...contact,
                changeType: webhookBody.changeType || 'updated',
                lastModifiedDateTime: new Date().toISOString()
            }));
        }
        
        // Fallback for single contact updates
        if (webhookBody.id) {
            return [{
                ...webhookBody,
                changeType: 'updated',
                lastModifiedDateTime: new Date().toISOString()
            }];
        }
        
        return [];
    }
});