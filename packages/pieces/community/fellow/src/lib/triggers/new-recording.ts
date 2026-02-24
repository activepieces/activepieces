import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { fellowAuth, getBaseUrl } from "../common/auth";
import { DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import dayjs from 'dayjs';
import { ListRecordingsResponse } from "../common/types";
import { isNil } from "@activepieces/shared";

const polling: Polling<AppConnectionValueForAuthProperty<typeof fellowAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const { subdomain, apiKey } = auth.props;
        const isTestMode = lastFetchEpochMS === 0;

        let hasMore = true;
        let cursor: string | null = null;
        const recordings = [];

        do {
            const requestBody: Record<string, any> = {
                pagination: {
                    page_size: 20,
                    cursor
                },
                include: {
                    transcript: true,
                    ai_notes: true
                },
            }

            if (!isTestMode) {
                requestBody['filters'] = {
                    created_at_start: dayjs(lastFetchEpochMS).toISOString()
                }
            }

            const response = await httpClient.sendRequest<ListRecordingsResponse>({
                method: HttpMethod.POST,
                url: getBaseUrl(subdomain) + '/recordings',
                headers: {
                    'X-API-KEY': apiKey
                },
                body: requestBody
            })


            for (const recording of response.body.recordings.data ?? []) {
                recordings.push(recording);
            }

            if (isTestMode) break;

            cursor = response.body.recordings.page_info.cursor;
            hasMore = !isNil(cursor);

        } while (hasMore)

        return recordings.map((rec) => ({
            epochMilliSeconds: dayjs(rec.started_at).valueOf(),
            data: rec
        }))
    },
}

export const newRecordingTrigger = createTrigger({
    name: 'new-recording',
    auth: fellowAuth,
    displayName: 'New Recording',
    description: 'Triggers when a new recording is created.',
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