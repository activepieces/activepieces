import { DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper  } from "@activepieces/pieces-common";
import { createTrigger, OAuth2PropertyValue, TriggerStrategy} from '@activepieces/pieces-framework';
import dayjs from "dayjs";
import { googleBussinessCommon } from '../common/common';

export const newReview = createTrigger({
    name: 'new_review',
    displayName: 'New Review',
    description: 'Triggers when there is new review',
    props: {
        authentication: googleBussinessCommon.authentication,
        location: googleBussinessCommon.location
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(ctx) {
        return await pollingHelper.test(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, {
            store: ctx.store,
            propsValue: ctx.propsValue
        });
    }
});


const polling: Polling<{ authentication: OAuth2PropertyValue, location: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS }) => {
        const items = await getResponse(propsValue.authentication, propsValue.location);
        return items.map((item) => ({
            epochMilliSeconds: dayjs(item.createTime).valueOf(),
            data: item,
        }));
    }
}

const getResponse = async (authentication: OAuth2PropertyValue, location: string,) => {
    const response = await httpClient.sendRequest<{ reviews: { createTime: string }[] }>({
        url: ` https://mybusiness.googleapis.com/v4/locations/${location}/reviews`,
        method: HttpMethod.GET,
        headers: {
            Authorization: `Bearer ${authentication.access_token}`,
        },
        queryParams: {
            pageSize: "100",
            orderBy: 'createTime desc',
        }
    })
    return response.body['reviews'];
}

