import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatedOpportunityStatus = createTrigger({
    auth: sellsyAuth,
    name: 'updatedOpportunityStatus',
    displayName: 'Updated Opportunity Status',
    description: 'Fires when an opportunity\'s status changes (e.g. stage update)',
    props: {},
    sampleData: {
        id: 12345,
        name: 'New Business Deal',
        description: 'Sample opportunity description',
        amount: 50000,
        currency: 'EUR',
        probability: 85,
        expected_close_date: '2024-12-31',
        status: 'negotiation',
        stage: 'proposal',
        previous_stage: 'qualification',
        owner_id: 1,
        client_id: 67890,
        created: '2024-01-01T00:00:00+00:00',
        updated: '2024-08-06T16:45:00+00:00',
        status_changed_at: '2024-08-06T16:45:00+00:00',
        tags: [],
        custom_fields: {}
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        const { auth, webhookUrl } = context;
        
        // Based on the webhook events response, we need both "step" and "status" events for opportunity changes
        const webhookData = {
            is_enabled: true,
            endpoint: webhookUrl,
            type: 'http',
            object_in_payload: true,
            json_content_type: true,
            configuration: [
                {
                    id: 'opportunity.step',
                    is_enabled: true
                },
                {
                    id: 'opportunity.status',
                    is_enabled: true
                }
            ]
        };

        console.log('Creating webhook for opportunity status changes with events: opportunity.step, opportunity.status');

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