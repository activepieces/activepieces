import { OAuth2PropertyValue, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { hubSpotAuthentication } from '../common/props'
import { hubSpotClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const currentValues = (await hubSpotClient.searchContacts(auth.access_token, {
            createdAt: lastFetchEpochMS
        })).results ?? []
        const items = currentValues.map((item: { createdAt: string }) => ({
            epochMilliSeconds: dayjs(item.createdAt).valueOf(),
            data: item
        }));
        return items;
    }
};

export const newContactAdded = createTrigger({
    auth: hubSpotAuthentication,
    name: 'new_contact',
    displayName: 'New Contact Added',
    description: 'Trigger when a new contact is added.',
    props: {},
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },


    sampleData: {
        id: "123",
        archived: false,
        createdAt: "2023-06-13T10:24:42.392Z",
        updatedAt: "2023-06-30T06:16:51.869Z",
        properties: {
            email: "contact@email.com",
            lastname: "Last",
            firstname: "First",
            createdate: "2023-06-13T10:24:42.392Z",
            hs_object_id: "123",
            lastmodifieddate: "2023-06-30T06:16:51.869Z"
        }
    },
});
