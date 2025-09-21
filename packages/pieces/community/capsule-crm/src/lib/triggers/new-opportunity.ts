import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newOpportunities = createTrigger({
    auth: capsuleCrmAuth,
    name: 'new_opportunity',
    displayName: 'New Opportunity',
    description: 'Fires when a new opportunity is created.',
    props: {},
    sampleData: {
        "opportunity": {
            "id": 12,
            "party": { "id": 581, "type": "organisation", "name": "Capsule" },
            "owner": { "id": 6, "username": "scottspacey", "name": "Scott Spacey" },
            "milestone": { "id": 14, "name": "Bid" },
            "createdAt": "2025-09-21T10:00:00Z",
            "updatedAt": "2025-09-21T10:00:00Z",
            "name": "Consulting",
            "description": "Scope and design web site shopping cart",
            "value": { "amount": 500, "currency": "GBP" },
            "expectedCloseOn": "2025-10-31",
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
                    event: 'opportunity/created',
                    targetUrl: context.webhookUrl,
                    description: 'Activepieces New Opportunity Trigger'
                }
            }
        );
       
        await context.store.put('opportunity_webhook_id', response.restHook.id);
    },

    
    async onDisable(context) {
        const webhookId = await context.store.get('opportunity_webhook_id');
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
       
        const response = await makeRequest<{ opportunities: unknown[] }>(
            context.auth,
            HttpMethod.GET,
            '/opportunities?perPage=1&embed=party,milestone'
        );
        return response.opportunities.map(opp => ({ opportunity: opp }));
    }
});