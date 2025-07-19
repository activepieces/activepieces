
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth }) => {
        const response = await makeRequest(auth, HttpMethod.GET, '/Lists');
        const items = Array.isArray(response) ? response : [];
        
        const sorted = items.sort((a, b) => b.id - a.id);
        return sorted.map(item => ({
            id: item.id,
            data: item,
        }));
    }
};

export const newListCreated = createTrigger({
    auth: smooveAuth,
    name: 'newListCreated',
    displayName: 'New List Created',
    description: 'Triggers when a new list is created in Smoove.',
    props: {},
    sampleData: {
        id: 173584,
        name: 'My subscribers list',
        description: 'This list is a list for new subscribers',
        publicName: 'My subscribers public name list',
        publicDescription: 'Public name - This list is a list for new subscribers',
        permissions: {
            isPublic: true,
            allowsUsersToSubscribe: true,
            allowsUsersToUnsubscribe: true,
            isPortal: false
        },
        contactsCount: 0
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});