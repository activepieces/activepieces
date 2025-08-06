import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newOpportunity = createTrigger({
    auth: sellsyAuth,
    name: 'newOpportunity',
    displayName: 'New Opportunity',
    description: 'Fires when a new opportunity is created in Sellsy',
    props: {},
    sampleData: {
        id: 12345,
        name: 'New Business Deal',
        description: 'Sample opportunity description',
        amount: 50000,
        currency: 'EUR',
        probability: 75,
        expected_close_date: '2024-12-31',
        status: 'open',
        stage: 'qualification',
        owner_id: 1,
        client_id: 67890,
        created: '2024-01-01T00:00:00+00:00',
        updated: '2024-01-01T00:00:00+00:00',
        tags: [],
        custom_fields: {}
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        const { auth, webhookUrl } = context;
        
        // Based on the webhook events response, the correct event ID for opportunity creation is "opportunity.created"
        const opportunityEventId = 'opportunity.created';
        
        console.log('Using opportunity event ID:', opportunityEventId);
        
        const webhookData = {
            is_enabled: true,
            endpoint: webhookUrl,
            type: 'http',
            object_in_payload: true,
            json_content_type: true,
            configuration: [
                {
                    id: opportunityEventId,
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