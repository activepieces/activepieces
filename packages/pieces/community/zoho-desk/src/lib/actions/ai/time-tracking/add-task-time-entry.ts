import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskAddTaskTimeEntryOutputSchema } from '../../../output-schemas';

export const zohoDeskAddTaskTimeEntryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_task_time_entry',
	outputSchema: zohoDeskAddTaskTimeEntryOutputSchema,
	displayName: 'Add Task Time Entry',
	description: 'Logs time spent on a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Logs time spent on one task. Not idempotent: each call adds another entry.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		executedTime: Property.DateTime({
			displayName: 'Executed Time',
			description: 'When the work was done, ISO 8601.',
			required: true,
		}),
		hoursSpent: Property.Number({
			displayName: 'Hours Spent',
			description: 'Whole hours spent.',
			required: false,
		}),
		minutesSpent: Property.Number({
			displayName: 'Minutes Spent',
			description: 'Minutes spent (0-59).',
			required: false,
		}),
		secondsSpent: Property.Number({
			displayName: 'Seconds Spent',
			description: 'Seconds spent (0-59).',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'What the time was spent on.',
			required: false,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Agent ID who did the work (from List Agents). Defaults to the connected agent.',
			required: false,
		}),
		isBillable: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Billable',
			description: 'Yes marks the entry billable.',
		}),
		requestChargeType: Property.StaticDropdown({
			displayName: 'Charge Type',
			description: 'Kind of work.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Customer Service', value: 'Customer Service' },
					{ label: 'Upgrade Request', value: 'Upgrade Request' },
					{ label: 'Product Consultation', value: 'Product Consultation' },
					{ label: 'Support and Maintenance', value: 'Support and Maintenance' },
				],
			},
		}),
		additionalCost: Property.Number({
			displayName: 'Additional Cost',
			description: 'Extra cost added to the entry.',
			required: false,
		}),
		customFields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Custom field values keyed by API name.',
			required: false,
		}),
	},
	async run(context) {
		const {
			orgId,
			taskId,
			executedTime,
			hoursSpent,
			minutesSpent,
			secondsSpent,
			description,
			ownerId,
			isBillable,
			requestChargeType,
			additionalCost,
			customFields,
		} = context.propsValue;
		return await zohoDeskApi.addTaskTimeEntry({
			auth: context.auth,
			orgId,
			taskId,
			executedTime,
			hoursSpent,
			minutesSpent,
			secondsSpent,
			description,
			ownerId,
			isBillable,
			requestChargeType,
			additionalCost,
			customFields,
		});
	},
});
