import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    OAuth2PropertyValue,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newUpdatedFile = createTrigger({
    auth: salesforceAuth,
    name: 'new_updated_file',
    displayName: 'New or Updated File on Record',
    description: 'Fires when an attachment, note, or file is added or updated on any record.',
    props: {},
    sampleData: {
        "Id": "00P7Q000002XyA4UAK",
        "ParentId": "0017Q00000qM8c9QAC",
        "Name": "sample_attachment.txt",
        "LastModifiedDate": "2025-10-10T12:00:00.000Z",
        "Type": "Attachment"
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

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const isoDate = dayjs(lastFetchEpochMS).toISOString();


        const attachmentsQuery = `
            SELECT FIELDS(ALL) FROM Attachment 
            WHERE SystemModstamp > ${isoDate} LIMIT 200
        `;
        const attachmentsResponse = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, attachmentsQuery);

        const notesQuery = `
            SELECT FIELDS(ALL) FROM Note 
            WHERE SystemModstamp > ${isoDate} LIMIT 200
        `;
        const notesResponse = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, notesQuery);

        const filesQuery = `
            SELECT FIELDS(ALL) FROM ContentDocumentLink 
            WHERE SystemModstamp > ${isoDate} LIMIT 200
        `;
        const filesResponse = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, filesQuery);

        const attachments = (attachmentsResponse.body?.['records'] || []).map((item: any) => ({
            epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
            data: { ...item, Type: 'Attachment' },
        }));
        const notes = (notesResponse.body?.['records'] || []).map((item: any) => ({
            epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
            data: { ...item, Type: 'Note' },
        }));
        const files = (filesResponse.body?.['records'] || []).map((item: any) => ({
            epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
            data: { ...item, Type: 'File' },
        }));

        const allItems = [...attachments, ...notes, ...files];
        return allItems.sort((a, b) => a.epochMilliSeconds - b.epochMilliSeconds);
    },
};