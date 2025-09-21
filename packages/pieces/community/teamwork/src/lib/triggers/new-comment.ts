import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const newComment = createTrigger({
    name: 'new_comment',
    displayName: 'New Comment',
    description: 'Triggers when a new comment is posted in Teamwork',
    auth: teamworkAuth,
    type: TriggerStrategy.POLLING,
    props: {},
    
    sampleData: {
        id: '123456',
        body: 'This is a sample comment',
        'html-body': '<p>This is a sample comment</p>',
        'author-id': '789',
        'author-firstname': 'John',
        'author-lastname': 'Doe',
        'author-avatar-url': 'https://example.com/avatar.jpg',
        'datetime-created': '2024-01-15T10:30:00Z',
        'datetime-updated': '2024-01-15T10:30:00Z',
        'resource-id': '456',
        'resource-type': 'task',
        'project-id': '123',
        'project-name': 'Sample Project'
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

        let endpoint = '/comments.json';
        const queryParams: Record<string, string> = {
            sort: 'created',
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

        const comments = response.comments || [];
        
        await context.store.put('_lastCheck', currentTime);

        return comments;
    },

    async test(context) {
        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/comments.json',
            queryParams: {
                sort: 'created',
                orderMode: 'desc',
                pageSize: '5'
            },
        });

        return response.comments || [];
    },
});
