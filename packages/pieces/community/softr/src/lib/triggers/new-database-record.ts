import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { SoftrAuth } from '../common/auth';
import { makeRequest, transformRecordFields } from '../common/client';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { TableField } from '../common/types';

type Props = {
	databaseId: string;
	tableId: string;
};

const polling: Polling<string, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { databaseId, tableId } = propsValue;

		let offset = 0;
		let hasMore = true;
		const isTest = lastFetchEpochMS === 0;

		const result = [];

		let count = 0;

		do {
			const response = await makeRequest<{
				data: { createdAt: string; fields: Record<string, any> }[];
			}>(
				auth,
				HttpMethod.GET,
				`/databases/${databaseId}/tables/${tableId}/records?limit=100&offset=${offset}`,
			);

			const items = response.data ?? [];

			result.push(...items);

			if (isTest) break;
			hasMore = items.length > 0;
			offset += 100;
			count++;
		} while (hasMore);


		console.log('COUNT',count)

		const tableReponse = await makeRequest<{
			data: {
				fields: TableField[];
			};
		}>(auth, HttpMethod.GET, `/databases/${databaseId}/tables/${tableId}`);

		return result.map((record) => {
			const transformedFields = transformRecordFields(tableReponse.data.fields, record.fields);
			return {
				epochMilliSeconds: dayjs(record.createdAt).valueOf(),
				data: {
					...record,
					fields: transformedFields,
				},
			};
		});
	},
};

export const newDatabaseRecord = createTrigger({
	auth: SoftrAuth,
	name: 'newDatabaseRecord',
	displayName: 'New Database Record',
	description: 'Triggers when a new record is added.',
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
	},
	sampleData: {
		id: 'rec123456',
		fields: {
			created_date: '2025-08-01T10:00:00Z',
			field1: 'Sample Value',
			field2: 'Another Value',
		},
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		const { store, auth, propsValue, files } = context;
		return await pollingHelper.test(polling, { store, auth, propsValue, files });
	},
	async onEnable(context) {
		const { store, auth, propsValue } = context;
		await pollingHelper.onEnable(polling, { store, auth, propsValue });
	},
	async onDisable(context) {
		const { store, auth, propsValue } = context;
		await pollingHelper.onDisable(polling, { store, auth, propsValue });
	},
	async run(context) {
		const { store, auth, propsValue, files } = context;
		return await pollingHelper.poll(polling, { store, auth, propsValue, files });
	},
});
