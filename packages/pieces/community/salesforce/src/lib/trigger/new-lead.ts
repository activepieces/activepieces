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

export const newLead = createTrigger({
    auth: salesforceAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new Lead record is created in Salesforce.',
    props: {},
    sampleData: {
        "Id": "00Q7Q000003x4aXUAQ",
        "Company": "ACME Inc.",
        "Name": "John Doe",
        "CreatedDate": "2025-10-10T12:00:00.000Z",
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
            FROM Lead
            WHERE CreatedDate > ${isoDate}
            ORDER BY CreatedDate ASC
            LIMIT 200
        `;

        const response = await querySalesforceApi<{ records: { CreatedDate: string }[] }>(
            HttpMethod.GET,
            auth,
            query
        );

        const records = response.body?.['records'] || [];

        return records.map((record: { CreatedDate: string }) => ({
            epochMilliSeconds: dayjs(record.CreatedDate).valueOf(),
            data: record,
        }));
    },
};