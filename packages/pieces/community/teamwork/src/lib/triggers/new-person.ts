import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const newPerson = createTrigger({
    name: 'new_person',
    displayName: 'New Person',
    description: 'Triggers when a new person is added in Teamwork',
    auth: teamworkAuth,
    type: TriggerStrategy.POLLING,
    props: {},
    
    sampleData: {
        id: '123456',
        'first-name': 'John',
        'last-name': 'Doe',
        'email-address': 'john.doe@example.com',
        'user-name': 'johndoe',
        title: 'Project Manager',
        'phone-number-mobile': '+1234567890',
        'phone-number-office': '+1234567891',
        'company-id': '789',
        'company-name': 'Sample Company',
        'avatar-url': 'https://example.com/avatar.jpg',
        'created-at': '2024-01-15T10:30:00Z',
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

        let endpoint = '/people.json';
        const queryParams: Record<string, string> = {
            orderby: 'created-at',
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

        const people = response.people || [];
        
        await context.store.put('_lastCheck', currentTime);

        return people;
    },

    async test(context) {
        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/people.json',
            queryParams: {
                orderby: 'created-at',
                orderMode: 'desc',
                pageSize: '5'
            },
        });

        return response.people || [];
    },
});
