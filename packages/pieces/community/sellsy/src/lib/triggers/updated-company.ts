import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatedCompany = createTrigger({
    auth: sellsyAuth,
    name: 'updatedCompany',
    displayName: 'Updated Company',
    description: 'Fires when a company record is updated in Sellsy',
    props: {},
    sampleData: {
        id: 12345,
        name: 'Acme Corporation',
        type: 'company',
        email: 'contact@acme.com',
        website: 'https://www.acme.com',
        phone_number: '+1234567890',
        mobile_number: '+1234567891',
        siret: '12345678901234',
        vat_number: 'FR12345678901',
        is_archived: false,
        owner_id: 1,
        created: '2024-01-01T00:00:00+00:00',
        updated: '2024-08-06T15:30:00+00:00',
        addresses: [],
        contacts: []
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        const { auth, webhookUrl } = context;
        
        // Based on the webhook events response, the correct event ID for client updates is "client.updated"
        const companyEventId = 'client.updated';
        
        console.log('Using company event ID:', companyEventId);
        
        const webhookData = {
            is_enabled: true,
            endpoint: webhookUrl,
            type: 'http',
            object_in_payload: true,
            json_content_type: true,
            configuration: [
                {
                    id: companyEventId,
                    is_enabled: true
                }
            ]
        };

        try {
            const response = await makeRequest(
                auth.access_token,
                HttpMethod.POST,
                '/webhooks',
                webhookData
            );

            await context.store?.put('webhook_id', response.id);
            
        } catch (error: any) {
            console.error('Failed to create webhook:', error);
            throw new Error(`Failed to create webhook: ${error.message}`);
        }
    },
    
    async onDisable(context) {
        const { auth } = context;
        const webhookId = await context.store?.get('webhook_id');
        
        if (webhookId) {
            try {
                await makeRequest(
                    auth.access_token,
                    HttpMethod.DELETE,
                    `/webhooks/${webhookId}`
                );
            } catch (error) {
                console.error('Failed to delete webhook:', error);
            }
        }
    },
    
    async run(context) {
        return [context.payload.body];
    }
});