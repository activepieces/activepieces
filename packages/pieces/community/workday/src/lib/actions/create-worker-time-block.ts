import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const createWorkerTimeBlockAction = createAction({
	auth: workdayAuth,
	name: 'create_worker_time_block',
	classification: 'WRITE',
	displayName: 'Create Worker Time Block',
	description: 'Creates a new worker time block in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Reports a time block for a worker (by WID) on a given date with a quantity of hours, optionally tagged with a time-entry-code WID and a comment. Use to log hours worked into Workday Time Tracking. Not idempotent: each call appends another reported time block.',
		idempotent: false,
	},
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker.',
			required: true,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Date of the time block (YYYY-MM-DD).',
			required: true,
		}),
		hours: Property.Number({
			displayName: 'Hours',
			description: 'Number of hours worked.',
			required: true,
		}),
		timeTypeId: Property.ShortText({
			displayName: 'Time Type ID',
			description: 'Time type reference ID.',
			required: false,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.createWorkerTimeBlock({
			auth,
			workerId: propsValue.workerId,
			date: propsValue.date,
			hours: propsValue.hours,
			timeTypeId: propsValue.timeTypeId,
			comment: propsValue.comment,
		});
	},
});
