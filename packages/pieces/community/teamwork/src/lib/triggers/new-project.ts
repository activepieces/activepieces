import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const newProject = createTrigger({
    name: 'new_project',
    displayName: 'New Project',
    description: 'Triggers when a new project is created in Teamwork',
    auth: teamworkAuth,
    type: TriggerStrategy.POLLING,
    props: {},
    
    sampleData: {
        id: '123456',
        name: 'Sample Project',
        description: 'This is a sample project description',
        status: 'active',
        'start-date': '2024-01-15',
        'end-date': '2024-03-15',
        category: 'Development',
        'company-id': '789',
        'company-name': 'Sample Company',
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

        let endpoint = '/projects.json';
        const queryParams: Record<string, string> = {
            orderby: 'created-on',
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

        const projects = response.projects || [];
        
        await context.store.put('_lastCheck', currentTime);

        return projects;
    },

    async test(context) {
        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/projects.json',
            queryParams: {
                orderby: 'created-on',
                orderMode: 'desc',
                pageSize: '5'
            },
        });

        return response.projects || [];
    },
});
