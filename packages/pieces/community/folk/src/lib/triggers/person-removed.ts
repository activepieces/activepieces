import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    async items({ auth }) {
        const response = await folkClient.getPeople({
            apiKey: auth as string,
            limit: 100,
        });

        const people = response.people || [];
        
        return people
            .filter((person: any) => person.deletedAt)
            .map((person: any) => ({
                id: person.id,
                data: person,
            }));
    },
};

export const personRemoved = createTrigger({
    auth: folkAuth,
    name: 'person_removed',
    displayName: 'Person Removed',
    description: 'Fires when a person is removed from your Folk workspace.',
    props: {},
    sampleData: {
        id: 'per_12345',
        fullName: 'John Doe',
        deletedAt: '2024-01-01T00:00:00Z',
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});

