
import { createTrigger, TriggerStrategy, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common/client';
import { NinoxAuth } from '../common/auth';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown } from '../common/props';

const props = {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
};

const polling: Polling<
    PiecePropValueSchema<typeof NinoxAuth>,
    StaticPropsValue<typeof props>
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { teamid, dbid, tid } = propsValue;
        const records = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`
        );
        return records
            .filter((record: any) => {
                const modified = dayjs(record.modifiedAt).valueOf();
                return modified > (lastFetchEpochMS ?? 0);
            })
            .map((record: any) => ({
                epochMilliSeconds: dayjs(record.modifiedAt).valueOf(),
                data: record,
            }));
    },
};

export const updatedRecord = createTrigger({
    auth: NinoxAuth,
    name: 'updatedRecord',
    displayName: 'Updated Record',
    description: 'Triggers when any existing record is updated',
    props,
    sampleData: [
        {
            id: 1,
            createdAt: '',
            createdBy: 0,
            modifiedAt: '2017-08-01T16:52:12',
            modifiedBy: 'EPZ2zSxuC7jt6WF2D',
            fields: {}
        },
        {
            id: 4,
            createdAt: '',
            createdBy: 'EPZ2zSxuC7jt6WF2D',
            modifiedAt: '2017-08-01T17:06:52',
            modifiedBy: 'EPZ2zSxuC7jt6WF2D',
            fields: {}
        }
    ],
    type: TriggerStrategy.POLLING,
    async test(context) {
        const { store, auth, propsValue, files } = context;
        return await pollingHelper.test(polling, { store, auth, propsValue, files });
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
        const { store, auth, propsValue, files } = context;
        return await pollingHelper.poll(polling, { store, auth, propsValue, files });
    },
});