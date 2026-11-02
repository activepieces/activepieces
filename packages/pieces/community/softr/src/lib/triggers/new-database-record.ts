import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrRecords } from '../common/records';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrListResponse, SoftrRecord } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

const PAGE_SIZE = 100;
const PAGE_OVERLAP = 5;
const TEST_SAMPLE_SIZE = 5;
const CREATED_AT_SORT_FIELD = 'created_at';

async function searchNewestFirst({ apiKey, databaseId, tableId, offset, limit }: SearchPageParams): Promise<SoftrListResponse<SoftrRecord>> {
	return softrRecords.searchRecords({
		apiKey,
		databaseId,
		tableId,
		body: {
			paging: { offset, limit },
			sorting: [{ sortingField: CREATED_AT_SORT_FIELD, sortType: 'DESC' }],
		},
	});
}

async function fetchNewestRecords({ apiKey, databaseId, tableId, lastFetchEpochMS }: FetchNewestParams): Promise<SoftrRecord[]> {
	if (lastFetchEpochMS === 0) {
		const sample = await searchNewestFirst({ apiKey, databaseId, tableId, offset: 0, limit: TEST_SAMPLE_SIZE });
		return sample.data ?? [];
	}
	const collected = new Map<string, SoftrRecord>();
	let offset = 0;
	let done = false;
	while (!done) {
		const page = await searchNewestFirst({ apiKey, databaseId, tableId, offset, limit: PAGE_SIZE });
		const records = page.data ?? [];
		const newer = records.filter((record) => dayjs(record.createdAt).valueOf() > lastFetchEpochMS);
		for (const record of newer) {
			collected.set(record.id, record);
		}
		const total = page.metadata?.total;
		const reachedEnd = records.length < PAGE_SIZE || (total !== undefined && offset + records.length >= total);
		done = reachedEnd || newer.length < records.length;
		offset += PAGE_SIZE - PAGE_OVERLAP;
	}
	return [...collected.values()];
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof SoftrAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { databaseId, tableId } = propsValue;
		const apiKey = auth.secret_text;
		const table = await softrClient.getTable({ apiKey, databaseId, tableId });
		const records = await fetchNewestRecords({ apiKey, databaseId, tableId, lastFetchEpochMS });
		return records
			.map((record) => ({
				epochMilliSeconds: dayjs(record.createdAt).valueOf(),
				data: softrClient.withFieldNames({ record, tableFields: table.fields }),
			}))
			.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
	},
};

export const newDatabaseRecord = createTrigger({
	auth: SoftrAuth,
	name: 'newDatabaseRecord',
	classification: 'READ',
	displayName: 'New Database Record',
	description: 'Triggers when a new record is added.',
	aiMetadata: {
		description:
			'Fires when a new record is added to the selected table of a Softr database. Polls on a schedule and emits each newly created record with field values keyed by field name, deduplicated by creation time.',
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
	},
	sampleData: {
		id: 'enzsqklVY6kWpm',
		fields: {
			Title: 'Sample record',
			Qty: 5,
			Done: true,
			Status: { id: 'e60f701b-7fbe-4543-8ded-08e568a9a7dc', label: 'Open' },
			When: '2026-10-08T12:00:00.000Z',
		},
		createdAt: '2026-10-08T14:49:30.855Z',
		updatedAt: '2026-10-08T14:49:30.855Z',
	},
	outputSchema: softrOutputSchemas.record,
	type: TriggerStrategy.POLLING,
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});

type Props = {
	databaseId: string;
	tableId: string;
};

type SearchPageParams = {
	apiKey: string;
	databaseId: string;
	tableId: string;
	offset: number;
	limit: number;
};

type FetchNewestParams = {
	apiKey: string;
	databaseId: string;
	tableId: string;
	lastFetchEpochMS: number;
};
