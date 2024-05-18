import { businessCentralAuth } from '../../';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { filterParams, makeClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<
	PiecePropValueSchema<typeof businessCentralAuth>,
	{ company_id: string; record_type: string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const filter: filterParams = {};

		if (lastFetchEpochMS) {
			filter['$filter'] = `lastModifiedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;
		} else {
			filter['$top'] = 10;
		}

		const client = makeClient(auth);
		const response = await client.filterRecords(
			propsValue.company_id,
			propsValue.record_type,
			filter,
		);

		return response.value.map((item: any) => {
			return {
				epochMilliSeconds: dayjs(item['lastModifiedDateTime']).valueOf(),
				data: item,
			};
		});
	},
};

export const newOrUpdatedRecordTrigger = createTrigger({
	auth: businessCentralAuth,
	name: 'new-or-updated-record',
	displayName: 'New or Updated Record',
	description: 'Triggers when a new record is added or modified.',
	type: TriggerStrategy.POLLING,
	sampleData: {},
	props: {
		company_id: commonProps.company_id,
		record_type: commonProps.record_type,
	},
	async test(ctx) {
		return await pollingHelper.test(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async onEnable(ctx) {
		await pollingHelper.onEnable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async onDisable(ctx) {
		await pollingHelper.onDisable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async run(ctx) {
		return await pollingHelper.poll(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
});
