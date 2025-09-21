
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CapsuleCRMAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
export const newTasks = createTrigger({
    auth: CapsuleCRMAuth,
    name: 'newTasks',
    displayName: 'New Tasks',
    description: '',
    props: {},
    sampleData: {
        event: 'task-created',
        task: {
            id: 401,
            description: 'Follow up with Jane Doe',
            dueOn: '2024-12-15',
            party: {
                id: 101,
                type: 'person',
                name: 'Jane Doe',
            },
            owner: {
                id: 1,
                username: 'johntest',
            },
        },
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhookUrl = context.webhookUrl;
        const body = {
            restHook: {
                event: 'case/created',
                targetUrl: webhookUrl,
                description: 'Triggered when a new case is created in Capsule CRM'
            }
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/resthooks',
            body
        );

        await context.store?.put('restHookId', response.restHook.id);
    },
    async onDisable(context) {
        const restHookId = await context.store?.get('restHookId');
        if (restHookId) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/resthooks/${restHookId}`
            );
        }
    },
    async run(context) {
        return [context.payload.body]
    }
})