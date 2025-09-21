import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const newCasesTrigger = createTrigger({
    auth: capsuleCrmAuth,
    name: 'new_cases',
    displayName: 'New Cases',
    description: 'Triggers when a new case is created in Capsule CRM',

    props: {},

    type: TriggerStrategy.POLLING,

    sampleData: {
        id: 123456,
        name: 'Sample Case',
        description: 'This is a sample case description',
        status: 'Open',
        party: {
            id: 789,
            name: 'Sample Contact'
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
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

        let endpoint = '/cases?perPage=50&sort=createdAt:desc';

        if (lastCheck) {
            endpoint += `&filter[createdAt][after]=${lastCheck}`;
        }

        const response = await capsuleCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            endpoint
        );

        const cases = response.cases || [];

        await context.store.put('_lastCheck', currentTime);

        return cases;
    },

    async test(context) {
        const response = await capsuleCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/cases?perPage=5&sort=createdAt:desc'
        );

        return response.cases || [];
    },
});
