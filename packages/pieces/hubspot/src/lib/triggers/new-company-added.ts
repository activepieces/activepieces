import { OAuth2PropertyValue, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { hubSpotAuthentication } from '../common/props'
import { hubSpotClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<{ authentication: OAuth2PropertyValue }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        const currentValues = (await hubSpotClient.searchCompanies(propsValue.authentication.access_token, {
            createdAt: lastFetchEpochMS
        })).results ?? []
        const items = currentValues.map((item: { createdAt: string }) => ({
            epochMilliSeconds: dayjs(item.createdAt).valueOf(),
            data: item
        }));
        return items;
    }
};

export const newCompanyAdded = createTrigger({
    name: 'new_company',
    displayName: 'New Company Added',
    description: 'Trigger when a new company is added.',
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

    sampleData: {
        id: "123123123",
        archived: false,
        createdAt: "2023-07-03T14:48:13.839Z",
        updatedAt: "2023-07-03T14:48:14.769Z",
        properties: {
            name: "Company Name",
            domain: "company.com",
            createdate: "2023-07-03T14:48:13.839Z",
            hs_object_id: "123123123",
            hs_lastmodifieddate: "2023-07-03T14:48:14.769Z"
        }
    },
});
