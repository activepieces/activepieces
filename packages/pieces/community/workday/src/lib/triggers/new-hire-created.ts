import dayjs from 'dayjs';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayUtils } from '../common/utils';

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	Record<string, never>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const rows = await workdayApi.listNewHires({ auth, sinceEpochMS: lastFetchEpochMS });
		return rows.map((row) => {
			return {
				epochMilliSeconds: dayjs(String(row['createdMoment'])).valueOf(),
				data: {
					id: workdayUtils.readNestedId({ value: row['worker'] }),
					descriptor: workdayUtils.readNestedDescriptor({ value: row['worker'] }),
					...row,
				},
			};
		});
	},
};

export const newHireCreatedTrigger = createTrigger({
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
