import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { codaAuth } from '../auth';
import { CodaRow, codaClient } from '../common/types';
import dayjs from 'dayjs';
import { docIdDropdown, tableIdDropdown } from '../common/props';
import { newRowCreatedTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 500;
const TEST_SAMPLE_SIZE = 5;

type Props = {
	tableId: string;
	docId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof codaAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { tableId, docId } = propsValue;
		const isTest = lastFetchEpochMS === 0;
		const client = codaClient(auth);

		let rows: CodaRow[] = [];
		let nextPageToken: string | undefined = undefined;

		do {
			const response = await client.listRows(docId, tableId, {
				sortBy: 'createdAt',
				valueFormat: 'simpleWithArrays',
				useColumnNames: true,
				limit: PAGE_SIZE,
				pageToken: nextPageToken,
			});
			const fresh = (response.items ?? []).filter((row) => dayjs(row.createdAt).valueOf() > lastFetchEpochMS);
			if (isTest) {
				rows = [...rows, ...fresh].slice(-TEST_SAMPLE_SIZE);
			} else {
				rows.push(...fresh);
			}
			nextPageToken = response.nextPageToken;
		} while (nextPageToken);

		if (isTest) {
			return [...rows]
				.reverse()
				.map((row) => ({ epochMilliSeconds: dayjs(row.createdAt).valueOf(), data: row }));
		}

		return rows.map((row) => {
			return {
				epochMilliSeconds: dayjs(row.createdAt).valueOf(),
				data: row,
			};
		});
	},
};

export const newRowCreatedTrigger = createTrigger({
	auth: codaAuth,
	name: 'new-row-created',
	classification: 'READ',
	displayName: 'New Row Created',
	description: 'Triggers when a new row is added to the selected table.',
	aiMetadata: {
		description: 'Fires when a new row is created in the selected Coda table, emitting that row. Polls and dedupes by row creation time, so it captures rows added since the last check.',
	},
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
	},
	outputSchema: newRowCreatedTriggerOutputSchema,
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		id: 'i-xxxxxxx',
		type: 'row',
		href: 'https://coda.io/apis/v1/docs/docId/tables/tableId/rows/rowId',
		name: 'Sample Row Name',
		index: 1,
		browserLink: 'https://coda.io/d/docId/tableId#_rui-xxxxxxx',
		createdAt: '2023-01-01T12:00:00.000Z',
		updatedAt: '2023-01-01T12:00:00.000Z',
		values: { 'c-columnId1': 'Sample Value', 'Column Name 2': 123 },
		parentTable: {
			id: 'grid-parentTableId123',
			type: 'table',
			name: 'Parent Table Name',
			href: 'https://coda.io/apis/v1/docs/docId/tables/grid-parentTableId123',
		},
	},
});
