import {
	DedupeStrategy,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayWqlRequestAll } from '../common';
import { readNestedDescriptor, readNestedId } from '../common/fields';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const since = dayjs(lastFetchEpochMS).toISOString();
		const limit = lastFetchEpochMS === 0 ? ' LIMIT 10' : '';
		const rows = await workdayWqlRequestAll(
			auth,
			`SELECT worker, hireDate, createdMoment FROM allWorkers WHERE createdMoment > '${since}' ORDER BY createdMoment DESC${limit}`,
		);
		return rows.map((row) => {
			return {
				epochMilliSeconds: dayjs(String(row['createdMoment'])).valueOf(),
				data: {
					id: readNestedId(row['worker']),
					descriptor: readNestedDescriptor(row['worker']),
					...row,
				},
			};
		});
	},
};

export const newHireCreated = createTrigger({
	auth: workdayAuth,
	name: 'new_hire_created',
	classification: 'READ',
	displayName: 'New Hire Created',
	description: 'Triggers when a new employee is hired in Workday.',
	aiMetadata: {
		description:
			'Fires for each worker hired in Workday after the trigger was enabled, detected by polling workers by hire date. Represents an employee onboarding event. Use to drive onboarding workflows (account provisioning, welcome notifications).',
	},
	props: {},
	sampleData: {
		id: '3aa5550b7fe348b98d7b5741afc65534',
		descriptor: 'John Smith',
		hireDate: '2026-04-01',
	},
	type: TriggerStrategy.POLLING,
	async test(ctx) {
		return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files });
	},
	async onEnable(ctx) {
		await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue });
	},
	async onDisable(ctx) {
		await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue });
	},
	async run(ctx) {
		return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files });
	},
});
