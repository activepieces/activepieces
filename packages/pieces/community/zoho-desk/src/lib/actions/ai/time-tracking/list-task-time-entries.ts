import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTaskTimeEntriesOutputSchema } from '../../../output-schemas';

export const zohoDeskListTaskTimeEntriesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_task_time_entries',
	outputSchema: zohoDeskListTaskTimeEntriesOutputSchema,
	displayName: 'List Task Time Entries',
	description: 'List Task Time Entries.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the time entries logged on one task.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		billStatus: Property.StaticDropdown({
			displayName: 'Bill Status',
			description: 'Only entries with this billing status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'billable', value: 'billable' },
					{ label: 'nonBillable', value: 'nonBillable' },
					{ label: 'billed', value: 'billed' },
				],
			},
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, taskId, billStatus, createdTimeRange, modifiedTimeRange, from, limit } =
			context.propsValue;
		const timeEntries = await zohoDeskApi.listTaskTimeEntries({
			auth: context.auth,
			orgId,
			taskId,
			billStatus,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
