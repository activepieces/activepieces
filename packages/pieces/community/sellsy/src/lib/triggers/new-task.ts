import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTask = createTrigger({
    auth: sellsyAuth,
    name: 'newTask',
    displayName: 'New Task',
    description: 'Fires when a new task is created in Sellsy',
    props: {},
    sampleData: {
        id: 12345,
        title: 'Follow up with client',
        description: 'Contact the client to discuss project requirements',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-08-15T14:00:00+00:00',
        assigned_to: 1,
        created_by: 1,
        client_id: 67890,
        opportunity_id: 54321,
        is_completed: false,
        completion_date: null,
        created: '2024-08-06T10:00:00+00:00',
        updated: '2024-08-06T10:00:00+00:00',
        tags: ['follow-up', 'client-contact'],
        custom_fields: {}
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        const { auth, webhookUrl } = context;
        
        // Based on the webhook events response, the correct event ID for task creation is "task.created"
        const taskEventId = 'task.created';
        
        console.log('Using task event ID:', taskEventId);
        
        const webhookData = {
            is_enabled: true,
            endpoint: webhookUrl,
            type: 'http',
            object_in_payload: true,
            json_content_type: true,
            configuration: [
                {
                    id: taskEventId,
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