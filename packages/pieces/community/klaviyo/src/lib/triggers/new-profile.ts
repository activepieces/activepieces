
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, Record<string, unknown>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        // Fetch profiles created after the last fetch time
        const since = lastFetchEpochMS ? new Date(lastFetchEpochMS).toISOString() : undefined;
        let path = '/profiles/?sort=created&fields[profile]=created,email,phone_number,external_id';
        if (since) {
            path += `&filter=greater(created,${since})`;
        }
        const { api_key } = auth;
        const response = await makeRequest(api_key as string, HttpMethod.GET, path);
        const items = response.data || [];
        return items.map((item: any) => ({
            epochMilliSeconds: dayjs(item.attributes.created).valueOf(),
            data: item,
        }));
    }
};


export const newProfile = createTrigger({
    auth: klaviyoAuth,
    name: 'newProfile',
    displayName: 'New Profile',
    description: 'Triggers when a new profile is created in the account.',
    props: {},
    sampleData: {
        id: '01Hfsdfsds',
        attributes: {
            email: 'user@example.com',
            created: '2024-06-01T12:00:00+00:00',
            phone_number: '+1234567890',
            external_id: 'external-123'
        }
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});