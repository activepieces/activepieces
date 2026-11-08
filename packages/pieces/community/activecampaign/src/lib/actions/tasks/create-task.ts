import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { activecampaignCommon, makeClient } from '../../common';
import { aiInput } from '../../common/ai-props';
import { rawTaskOutputSchema } from '../../common/output-schemas';

export const createTaskAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_task_human',
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Creates a task on a contact or deal.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a task on a contact or deal. Each call creates a task.',
		idempotent: false,
	},
	outputSchema: rawTaskOutputSchema,
	props: {
		ownerType: Property.StaticDropdown<string>({
			displayName: 'Attach To',
			required: true,
			defaultValue: 'contact',
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Deal', value: 'deal' },
				],
			},
		}),
		recordId: Property.ShortText({
			displayName: 'Contact or Deal ID',
			description: 'Map it from the trigger or an earlier step.',
			required: true,
		}),
		taskTypeId: activecampaignCommon.taskTypeId,
		title: Property.ShortText({ displayName: 'Title', required: false }),
		note: Property.LongText({ displayName: 'Note', required: false }),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			description: 'Times are UTC unless the value carries an offset. A date without a time is sent as 12:00 UTC so the task stays on that day.',
			required: true,
		}),
		endDate: Property.DateTime({ displayName: 'End Date', description: 'Defaults to 15 minutes after the due date.', required: false }),
		assigneeId: activecampaignCommon.userId({ displayName: 'Assignee', required: false }),
	},
	async run({ auth, propsValue }) {
		const dealTask = {
			ownerType: propsValue.ownerType,
			relid: aiInput.numericId({ value: propsValue.recordId, label: 'Contact or Deal ID' }),
			dealTasktype: propsValue.taskTypeId,
			title: aiInput.optionalText(propsValue.title),
			note: aiInput.optionalText(propsValue.note),
			duedate: aiInput.isoDateTime({ value: propsValue.dueDate, label: 'Due Date', dateOnlyAt: 'noon' }),
			edate: aiInput.isoDateTime({ value: propsValue.endDate, label: 'End Date', dateOnlyAt: 'noon' }),
			assignee: aiInput.optionalText(propsValue.assigneeId),
		};
		return (await makeClient(auth.props).request({ method: 'POST', path: '/dealTasks', body: { dealTask } })).body;
	},
});
