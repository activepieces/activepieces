import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    OAuth2PropertyValue,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newCaseAttachment = createTrigger({
    auth: salesforceAuth,
    name: 'new_case_attachment',
    displayName: 'New Case Attachment',
    description: 'Fires when a new Attachment or File is added to any Case record.',
    props: {},
    sampleData: {
        "Id": "00P7Q000002XyA4UAK",
        "ParentId": "5007Q000006g75iQAA",
        "Name": "sample_attachment.txt",
        "ContentType": "text/plain",
        "CreatedDate": "2025-10-10T12:00:00.000Z",
        "attachment_type": "Classic"
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

        const classicQuery = `
            SELECT FIELDS(ALL) FROM Attachment 
            WHERE Parent.Type = 'Case' AND SystemModstamp > ${isoDate}
            LIMIT 200
        `;
        const classicResponse = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, classicQuery);
        const classicAttachments = classicResponse.body?.['records'] || [];

        const recentCasesQuery = `SELECT Id FROM Case WHERE SystemModstamp > ${isoDate} LIMIT 200`;
        const recentCasesResponse = await querySalesforceApi<{ records: { Id: string }[] }>(HttpMethod.GET, auth, recentCasesQuery);
        const recentCaseIds = recentCasesResponse.body?.['records'].map(c => `'${c.Id}'`);

        let fileLinks: any[] = [];
        if (recentCaseIds && recentCaseIds.length > 0) {
            const filesQuery = `
                SELECT FIELDS(ALL) FROM ContentDocumentLink 
                WHERE LinkedEntityId IN (${recentCaseIds.join(',')}) AND SystemModstamp > ${isoDate}
                LIMIT 200
            `;
            const filesResponse = await querySalesforceApi<{ records: { SystemModstamp: string }[] }>(HttpMethod.GET, auth, filesQuery);
            fileLinks = filesResponse.body?.['records'] || [];
        }

        const classicItems = classicAttachments.map((item: any) => ({
            epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
            data: { ...item, attachment_type: 'Classic' },
        }));

        const fileItems = fileLinks.map((item: any) => ({
            epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
            data: { ...item, attachment_type: 'File' },
        }));

        const allItems = [...classicItems, ...fileItems];
        return allItems.sort((a, b) => a.epochMilliSeconds - b.epochMilliSeconds);
    },
};