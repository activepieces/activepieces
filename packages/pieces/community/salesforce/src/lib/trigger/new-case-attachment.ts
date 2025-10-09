import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    OAuth2PropertyValue,
    Property,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newCaseAttachment = createTrigger({
    auth: salesforceAuth,
    name: 'new_case_attachment',
    displayName: 'New Case Attachment (Classic)',
    description: 'Fires when a new classic Attachment is added to a Case record. Note: This does not support modern "Files".',
    props: {
        conditions: Property.LongText({
            displayName: 'Conditions (Advanced)',
            description: "Optionally, enter a SOQL WHERE clause to further filter attachments (e.g., \"ContentType = 'application/pdf'\"). Do not include 'AND'.",
            required: false,
        }),
    },
    sampleData: {
        "Id": "00P7Q000002XyA4UAK",
        "ParentId": "5007Q000006g75iQAA",
        "Name": "sample_attachment.txt",
        "ContentType": "text/plain",
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

const polling: Polling<OAuth2PropertyValue, { conditions: string | undefined }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const isoDate = dayjs(lastFetchEpochMS).toISOString();

        const query = `
            SELECT FIELDS(ALL)
            FROM Attachment 
            WHERE Parent.Type = 'Case' AND CreatedDate > ${isoDate}
            ${propsValue.conditions ? `AND ${propsValue.conditions}` : ''}
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