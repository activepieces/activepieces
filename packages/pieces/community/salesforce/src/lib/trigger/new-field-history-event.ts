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
import { querySalesforceApi, salesforcesCommon } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newFieldHistoryEvent = createTrigger({
    auth: salesforceAuth,
    name: 'new_field_history_event',
    displayName: 'New Field History Event',
    description: 'Fires when a tracked field is updated on a specified object.',
    props: {
        object: salesforcesCommon.object,
    },
    sampleData: {
        "Id": "0177Q00000s912jQAA",
        "IsDeleted": false,
        "ParentId": "0017Q00000qM8c9QAC",
        "CreatedById": "0057Q000003h3VwQAI",
        "CreatedDate": "2025-10-10T12:00:00.000Z",
        "Field": "Industry",
        "OldValue": "Agriculture",
        "NewValue": "Technology"
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


const polling: Polling<AppConnectionValueForAuthProperty<typeof salesforceAuth>, { object: string | undefined }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { object } = propsValue;
        

        if (!object) {
            return [];
        }

        const isoDate = dayjs(lastFetchEpochMS).toISOString();

        const historyObject = object.endsWith('__c')
            ? object.replace('__c', '__History')
            : `${object}History`;

        const query = `
            SELECT FIELDS(ALL)
            FROM ${historyObject}
            WHERE CreatedDate > ${isoDate}
            ORDER BY CreatedDate ASC
            LIMIT 200
        `;

        try {
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
        } catch (error) {
            console.warn(`Could not poll for history on ${historyObject}. It might not exist or have history tracking enabled.`);
            return [];
        }
    },
};