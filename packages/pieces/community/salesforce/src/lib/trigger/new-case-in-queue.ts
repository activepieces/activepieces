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

        const isoDate = dayjs(lastFetchEpochMS).toISOString();

        // Step 1a: Cases moved to queue after creation via owner change (CaseHistory).
        // Assignment Rules that fire during case creation do NOT write a CaseHistory entry,
        // so we also query Case directly (Step 1b) to cover that scenario.
        const historyResponse = await querySalesforceApi<{
            records: { CaseId: string; CreatedDate: string; NewValue: string }[];
        }>(
            HttpMethod.GET,
            auth,
            `SELECT CaseId, CreatedDate, NewValue FROM CaseHistory WHERE Field = 'Owner' AND CreatedDate > ${isoDate}`,
        );

        // NewValue is not filterable in SOQL — filter in code.
        const historyRecords = (historyResponse.body?.['records'] ?? []).filter(
            (r) => r.NewValue === caseQueueId,
        );

        // Step 1b: Cases assigned to queue on creation via Assignment Rules.
        // These never produce a CaseHistory entry — detected via Case.CreatedDate.
        // Cases created before isoDate are excluded, so no overlap with Step 1a.
        const directResponse = await querySalesforceApi<{
            records: { Id: string; CreatedDate: string }[];
        }>(
            HttpMethod.GET,
            auth,
            `SELECT Id, CreatedDate FROM Case WHERE OwnerId = '${caseQueueId}' AND CreatedDate > ${isoDate}`,
        );

        const directRecords = directResponse.body?.['records'] ?? [];

        // Merge both sources — CaseHistory overwrites on duplicate since its CreatedDate
        // reflects the actual assignment time, which is more accurate than Case.CreatedDate.
        const caseIdToQueueDate: Record<string, string> = {};
        for (const r of directRecords) {
            caseIdToQueueDate[r.Id] = r.CreatedDate;
        }
        for (const r of historyRecords) {
            caseIdToQueueDate[r.CaseId] = r.CreatedDate;
        }

        if (Object.keys(caseIdToQueueDate).length === 0) return [];

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
