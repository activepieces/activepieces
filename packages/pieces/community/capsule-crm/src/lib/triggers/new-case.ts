import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newCases = createTrigger({
    auth: capsuleCrmAuth,
    name: 'new_case',
    displayName: 'New Case (Project)',
    description: 'Fires when a new case (now called a project) is created in Capsule CRM.',
    props: {},
    sampleData: {
        "kase": {
            "id": 12,
            "party": { "id": 892, "type": "organisation", "name": "Zestia" },
            "owner": { "id": 61, "username": "ted", "name": "Ted Danson" },
            "status": "OPEN",
            "stage": { "name": "Project Brief", "id": 149 },
            "createdAt": "2025-09-21T10:00:00Z",
            "updatedAt": "2025-09-21T10:00:00Z",
            "expectedCloseOn": "2025-12-09",
            "description": "Scope and design web site shopping cart",
            "name": "Consulting"
        }
    },
    type: TriggerStrategy.WEBHOOK,

    
    async onEnable(context) {
        const response = await makeRequest<{ restHook: { id: number } }>(
            context.auth,
            HttpMethod.POST,
            '/resthooks',
            {
                restHook: {
                    event: 'project/created',
                    targetUrl: context.webhookUrl,
                    description: 'Activepieces New Project (Case) Trigger'
                }
            }
        );
       
        await context.store.put('webhook_id', response.restHook.id);
    },

 
    async onDisable(context) {
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await makeRequest(
                context.auth,
                HttpMethod.DELETE,
                `/resthooks/${webhookId}`
            );
        }
    },

   
    async run(context) {
     
        return [context.payload.body];
    },

   
    async test(context) {
        const response = await makeRequest<{ kases: unknown[] }>(
            context.auth,
            HttpMethod.GET,
            '/kases?perPage=1&embed=party,opportunity'
        );
        return response.kases.map(kase => ({ kase }));
    }
});