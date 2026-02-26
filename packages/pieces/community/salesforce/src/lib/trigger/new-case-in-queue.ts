import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

// https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select_fields.htm
// Hard Salesforce limit: FIELDS(ALL) returns at most 200 records per query
const FIELDS_ALL_LIMIT = 200;

export const newCaseCreatedTrigger = createTrigger({
    auth: salesforceAuth,
    name: 'new_case',
    displayName: 'New Case in Queue',
    description: 'Triggers when a new Case record is assigned to a specified queue.',
    props: {
        caseQueueId: salesforcesCommon.caseQueueId,
    },
    sampleData: undefined,
    type: TriggerStrategy.POLLING,
    async test(ctx) {
        return pollingHelper.test(polling, ctx);
    },
    async onEnable(ctx) {
        return pollingHelper.onEnable(polling, ctx);
    },
    async onDisable(ctx) {
        return pollingHelper.onDisable(polling, ctx);
    },
    async run(ctx) {
        return pollingHelper.poll(polling, ctx);
    },
});

const polling: Polling<
    AppConnectionValueForAuthProperty<typeof salesforceAuth>,
    { caseQueueId: string }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS, propsValue }) => {
        const { caseQueueId } = propsValue;

        if (lastFetchEpochMS === 0) {
            // Test mode: return the 10 most recent cases currently in the queue
            const response = await querySalesforceApi<{ records: { CreatedDate: string }[] }>(
                HttpMethod.GET,
                auth,
                `SELECT FIELDS(ALL) FROM Case WHERE OwnerId = '${caseQueueId}' ORDER BY CreatedDate DESC LIMIT 10`,
            );

            return (response.body?.['records'] ?? []).map((record: { CreatedDate: string }) => ({
                epochMilliSeconds: dayjs(record.CreatedDate).valueOf(),
                data: record,
            }));
        }

        // Step 1: Find all cases assigned to this queue since last poll via CaseHistory.
        // Using CaseHistory.CreatedDate (queue-assignment time) ensures we never miss a case
        // that was created before the last sync but assigned to the queue after it.
        const isoDate = dayjs(lastFetchEpochMS).toISOString();

        const historyResponse = await querySalesforceApi<{
            records: { CaseId: string; CreatedDate: string }[];
        }>(
            HttpMethod.GET,
            auth,
            `SELECT CaseId, CreatedDate FROM CaseHistory WHERE Field = 'Owner' AND NewValue = '${caseQueueId}' AND CreatedDate > ${isoDate}`,
        );

        const historyRecords = historyResponse.body?.['records'] ?? [];
        if (historyRecords.length === 0) return [];

        const caseIdToQueueDate: Record<string, string> = Object.fromEntries(
            historyRecords.map((r) => [r.CaseId, r.CreatedDate]),
        );
        const allIds = Object.keys(caseIdToQueueDate);

        // Step 2: Fetch full Case records in sequential batches of 200 (FIELDS(ALL) limit).
        const allCaseRecords: Record<string, unknown>[] = [];

        for (let i = 0; i < allIds.length; i += FIELDS_ALL_LIMIT) {
            const chunk = allIds.slice(i, i + FIELDS_ALL_LIMIT);
            const ids = chunk.map((id) => `'${id}'`).join(',');

            const caseResponse = await querySalesforceApi<{ records: Record<string, unknown>[] }>(
                HttpMethod.GET,
                auth,
                `SELECT FIELDS(ALL) FROM Case WHERE Id IN (${ids}) LIMIT ${FIELDS_ALL_LIMIT}`,
            );

            allCaseRecords.push(...(caseResponse.body?.['records'] ?? []));
        }

        return allCaseRecords.map((record) => ({
            epochMilliSeconds: dayjs(
                (caseIdToQueueDate[record['Id'] as string] ?? record['CreatedDate']) as string,
            ).valueOf(),
            data: record,
        }));
    },
};
