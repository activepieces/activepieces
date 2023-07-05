import { OAuth2PropertyValue, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { hubSpotAuthentication } from '../common/props'
import { hubSpotClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<{ authentication: OAuth2PropertyValue }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        const currentValues = (await hubSpotClient.searchTickets(propsValue.authentication.access_token, {
            createdAt: lastFetchEpochMS
        })).results ?? []
        const items = currentValues.map((item: { createdAt: string }) => ({
            epochMilliSeconds: dayjs(item.createdAt).valueOf(),
            data: item
        }));
        return items;
    }
};

export const newTicketAdded = createTrigger({
    name: 'new_ticket',
    displayName: 'New Ticket Added',
    description: 'Trigger when a new ticket is added.',
    props: {
        authentication: hubSpotAuthentication
    },
    type: TriggerStrategy.POLLING,
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
    },

    sampleData: {},
});
