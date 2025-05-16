import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { codaAuth } from '../..';
import { CodaRow, codaClient } from '../common/types';
import dayjs from 'dayjs';
import { docIdDropdown, tableIdDropdown } from '../common/props';

type Props = {
	tableId: string;
	docId: string;
};

const polling: Polling<PiecePropValueSchema<typeof codaAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { tableId, docId } = propsValue;
		const isTest = lastFetchEpochMS === 0;
		const client = codaClient(auth);

		const rows: CodaRow[] = [];
		let nextPageToken: string | undefined = undefined;

		// We will sort by createdAt to process in order. The API default is ascending.
		do {
			const response = await client.listRows(docId, tableId, {
				sortBy: 'createdAt', // Default is ascending
				valueFormat: 'simpleWithArrays',
				useColumnNames: true,
				limit: isTest ? 5 : 100,
				pageToken: nextPageToken,
			});

			if (response.items) {
				for (const row of response.items) {
					rows.push(row);
				}
			}
			if (isTest) break;
			nextPageToken = response.nextPageToken;
		} while (nextPageToken);

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
	displayName: 'New Row Created',
	description: 'Triggers when a new row is added to the selected table.',
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
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
