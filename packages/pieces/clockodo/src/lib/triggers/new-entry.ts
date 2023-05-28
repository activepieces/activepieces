import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { clockodoCommon, currentYear } from '../common';
import { ClockodoClient } from '../common/client';

interface AuthData {
    email: string,
    token: string,
    company_name: string,
    company_email: string
}

const polling: Polling<{ authentication: AuthData }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ propsValue }) => {
        const client = new ClockodoClient(
            propsValue.authentication.email,
            propsValue.authentication.token,
            propsValue.authentication.company_name,
            propsValue.authentication.company_email
        )
        const time_since = (currentYear() - 1) + '-01-01T00:00:00Z';
        const time_until = (currentYear() + 1) + '-12-31T23:59:59Z';
        let res = await client.listEntries({ time_since, time_until })
        if(res.paging.count_pages > 1) {
            res = await client.listEntries({ time_since, time_until, page: res.paging.count_pages })
        }
        return res.entries.sort((a, b) => b.id - a.id).map((a) => ({
            id: a.id,
            data: a,
        }));
    }
}

export default createTrigger({
    name: 'new_entry',
    displayName: 'New Entry',
    description: 'Triggers when a new time entry is created',
    type: TriggerStrategy.POLLING,
    props: {
        authentication: clockodoCommon.authentication
    },
    sampleData: {},
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    }
});