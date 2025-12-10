import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { leexiAuth } from "../common/auth";
import { AuthenticationType, DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper, QueryParams } from "@activepieces/pieces-common";
import dayjs from 'dayjs';
import { BASE_URL } from "../common/constants";
import { ListCallResponse } from "../common/types";
import { isEmpty } from "@activepieces/shared";

const polling: Polling<AppConnectionValueForAuthProperty<typeof leexiAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const isTestMode = lastFetchEpochMS === 0;

        let page = 1;
        let hasMore = true;

        const calls = [];

        do {
            const qs: QueryParams = {
                page: page.toString(),
                items: isTestMode ? '5' : '100',
            }

            if (!isTestMode) qs['from'] = dayjs(lastFetchEpochMS).toISOString();

            const response = await httpClient.sendRequest<ListCallResponse>({
                method: HttpMethod.GET,
                url: BASE_URL + '/calls',
                authentication: {
                    type: AuthenticationType.BASIC,
                    username: auth.username,
                    password: auth.password
                }
            });

            const callList = response.body.data ?? [];

            for (const call of callList) {
                calls.push(call)
            }

            if (isTestMode) break;

            page++;
            hasMore = !isEmpty(callList)

        } while (hasMore);


        return calls.map((call) => ({
            epochMilliSeconds: dayjs(call.created_at).valueOf(),
            data: call
        }))
    }
}

export const newCallCreatedTrigger = createTrigger({
    name: 'new-call-created',
    auth: leexiAuth,
    displayName: 'New Call Created',
    description: 'Triggers when a new call is created.',
    type: TriggerStrategy.POLLING,
    props: {},
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
    sampleData: undefined
})