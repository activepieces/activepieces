import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


interface CapsuleKase {
    id: number;
    createdAt: string;
    [key: string]: any;
}

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        
        const since = new Date(lastFetchEpochMS - 5000).toISOString();
        const allKases: CapsuleKase[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await makeRequest<{ kases: CapsuleKase[] }>(
                auth,
                HttpMethod.GET,
                `/kases?since=${since}&page=${page}&perPage=50&embed=tags,party,opportunity`
            );

            allKases.push(...response.kases);

            if (response.kases.length < 50) {
                hasMore = false;
            } else {
                page++;
            }
        }

        const items = allKases.map((kase) => ({
            epochMilliSeconds: new Date(kase.createdAt).getTime(),
            data: kase,
        }));
        
        items.sort((a, b) => a.epochMilliSeconds - b.epochMilliSeconds);
        
        return items;
    },
};

export const newProjects = createTrigger({
    auth: capsuleCrmAuth,
    name: 'new_projects',
    displayName: 'New Projects',
    description: 'Fires when a project is created.',
    props: {},
    sampleData: {
        "id": 12,
        "party": { "id": 892, "type": "organisation", "name": "Zestia" },
        "owner": { "id": 61, "username": "ted", "name": "Ted Danson" },
        "status": "OPEN",
        "opportunity": { "id": 83948362, "name": "Scope and design web site shopping cart" },
        "stage": { "name": "Project Brief", "id": 149 },
        "createdAt": "2025-09-21T10:00:00Z",
        "updatedAt": "2025-09-21T10:00:00Z",
        "expectedCloseOn": "2025-12-09",
        "description": "Scope and design web site shopping cart",
        "name": "Consulting"
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});