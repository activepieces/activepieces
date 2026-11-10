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
		const rows = await workdayApi.listTerminations({ auth, sinceEpochMS: lastFetchEpochMS });
		return rows.map((row) => {
			return {
				epochMilliSeconds: dayjs(String(row['dateAndTimeCompleted'])).valueOf(),
				data: {
					id: workdayUtils.readNestedId({ value: row['worker'] }),
					descriptor: workdayUtils.readNestedDescriptor({ value: row['worker'] }),
					terminationDate: row['effectiveDate'],
					...row,
				},
			};
		});
	},
};

export const employeeTerminatedTrigger = createTrigger({
	auth: workdayAuth,
	name: 'employee_terminated',
	classification: 'READ',
	displayName: 'Employee Terminated',
	description: 'Triggers when an employee is terminated in Workday.',
	aiMetadata: {
		description:
			'Fires for each worker whose termination is recorded in Workday after the trigger was enabled, detected by polling workers by termination date. Represents an employee offboarding event. Use to drive offboarding workflows (access revocation, notifications).',
	},
	props: {},
	sampleData: {
		id: '3aa5550b7fe348b98d7b5741afc65534',
		descriptor: 'Jane Doe',
		terminationDate: '2026-04-01',
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
