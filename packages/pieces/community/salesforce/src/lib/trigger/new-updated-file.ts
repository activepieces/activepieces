import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newUpdatedFile = createTrigger({
    auth: salesforceAuth,
    name: 'new_updated_file',
    displayName: 'New or Updated File',
    description: 'Fires when a file (ContentDocument) is created or updated. Does not fire for classic Attachments or Notes.',
    props: {},
    sampleData: {
        "Id": "0697Q000002qB9iQAE",
        "Title": "My Document.pdf",
        "LastModifiedDate": "2025-10-10T12:00:00.000Z",
        "Type": "ContentDocument"
    },
    type: TriggerStrategy.POLLING,
    async test(ctx) {
        return await pollingHelper.test(polling, ctx);
    },
    async onEnable(ctx) {
        await pollingHelper.onEnable(polling, ctx);
    },
    async onDisable(ctx) {
        await pollingHelper.onDisable(polling, ctx);
    },
    async run(ctx) {
        return await pollingHelper.poll(polling, ctx);
    },
});

const polling: Polling<AppConnectionValueForAuthProperty<typeof salesforceAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const isoDate = dayjs(lastFetchEpochMS).toISOString();

        const query = `
            SELECT FIELDS(ALL) 
            FROM ContentDocument 
            WHERE SystemModstamp > ${isoDate}
            ORDER BY SystemModstamp ASC
            LIMIT 200
        `;
        
        const response = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, query);
        const records = response.body?.['records'] || [];

        return records.map((record: any) => ({
            epochMilliSeconds: dayjs(record.SystemModstamp).valueOf(),
            data: { ...record, Type: 'ContentDocument' },
        }));
    },
};