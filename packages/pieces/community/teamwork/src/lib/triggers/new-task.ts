import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const newTask = createTrigger({
    name: 'new_task',
    displayName: 'New Task',
    description: 'Triggers when a new task is created in Teamwork',
    auth: teamworkAuth,
    type: TriggerStrategy.POLLING,
    props: {},
    
    sampleData: {
        id: '123456',
        content: 'Sample Task Name',
        description: 'This is a sample task description',
        'due-date': '2024-01-20',
        priority: 'medium',
        completed: false,
        'project-id': '789',
        'project-name': 'Sample Project',
        'responsible-party-id': '456',
        'responsible-party-firstname': 'John',
        'responsible-party-lastname': 'Doe',
        'created-on': '2024-01-15T10:30:00Z',
        'last-changed-on': '2024-01-15T10:30:00Z'
    },

    async onEnable(context) {
        await context.store.put('_lastCheck', new Date().toISOString());
    },

    async onDisable(context) {
        await context.store.delete('_lastCheck');
    },

    async run(context) {
        const lastCheck = await context.store.get('_lastCheck') as string;
        const currentTime = new Date().toISOString();

        let endpoint = '/tasks.json';
        const queryParams: Record<string, string> = {
            sort: 'created-on',
            orderMode: 'desc',
            pageSize: '50'
        };

        if (lastCheck) {
            queryParams['createdAfter'] = lastCheck;
        }

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: endpoint,
            queryParams,
        });

        const tasks = response['todo-items'] || [];
        
        await context.store.put('_lastCheck', currentTime);

        return tasks;
    },

    async test(context) {
        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/tasks.json',
            queryParams: {
                sort: 'created-on',
                orderMode: 'desc',
                pageSize: '5'
            },
        });

        return response['todo-items'] || [];
    },
});
