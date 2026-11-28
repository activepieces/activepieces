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
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description:
				'An ISO 8601 date or date-time, such as 2026-03-01 or 2026-03-01T09:00:00Z. Times are UTC unless you add an offset (2026-03-01T09:00:00-06:00). A date without a time is sent as 12:00 UTC, which keeps the task on that day for accounts between UTC-11 and UTC+11; for other time zones, give a time with an offset.',
			required: true,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Optional, in the same format as Due Date and not before it. A date without a time means 12:00 UTC. Defaults to 15 minutes after the due date.',
			required: false,
		}),
		assigneeId: activecampaignCommon.userId({ displayName: 'Assignee', required: false }),
	},
	async run({ auth, propsValue }) {
		const duedate = aiInput.isoDateTime({ value: propsValue.dueDate, label: 'Due Date', dateOnlyAt: 'noon' });
		if (duedate === undefined) {
			throw new Error('Due Date is required.');
		}
		const edate = aiInput.isoDateTime({ value: propsValue.endDate, label: 'End Date', dateOnlyAt: 'noon' });
		if (edate !== undefined && Date.parse(edate) < Date.parse(duedate)) {
			throw new Error('End Date must not be before Due Date.');
		}
		const dealTask = {
			ownerType: propsValue.ownerType,
			relid: aiInput.numericId({ value: propsValue.recordId, label: 'Contact or Deal ID' }),
			dealTasktype: propsValue.taskTypeId,
			title: aiInput.optionalText(propsValue.title),
			note: aiInput.optionalText(propsValue.note),
			duedate,
			edate,
			assignee: aiInput.optionalText(propsValue.assigneeId),
		};
		return (await makeClient(auth.props).request({ method: 'POST', path: '/dealTasks', body: { dealTask } })).body;
	},
});
