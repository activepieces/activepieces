
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    PiecePropValueSchema,
    TriggerStrategy,
    createTrigger,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';
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
                const created = dayjs(record.createdAt || record.created_date).valueOf();
                return created > (lastFetchEpochMS ?? 0);
            })
            .map((record: any) => ({
                epochMilliSeconds: dayjs(record.createdAt || record.created_date).valueOf(),
                data: record,
            }));
    },
};

export const newRecord = createTrigger({
    auth: NinoxAuth,
    name: 'newRecord',
    displayName: 'New Record',
    description: 'Triggers when a new record is created in a table',
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