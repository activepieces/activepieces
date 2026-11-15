import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
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
	propertyGroups: [
		{ key: 'record', display: 'section', label: 'Record', icon: 'inbox', props: ['ownerType', 'recordId'] },
		{ key: 'task', display: 'section', label: 'Task', icon: 'text', props: ['taskTypeId', 'title', 'note'] },
		{ key: 'schedule', display: 'section', label: 'Schedule', icon: 'calendar', props: ['dateNote', 'dueDate', 'endDate', 'assigneeId'] },
	],
	props: {
		ownerType: Property.StaticDropdown<string>({
			displayName: 'Attach To',
			required: true,
			defaultValue: 'contact',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'contact', description: 'A person' },
					{ label: 'Deal', value: 'deal', description: 'A sales opportunity' },
				],
			},
		}),
		recordId: Property.ShortText({
			displayName: 'Contact or Deal ID',
			description: 'The contact or deal ID, mapped from a trigger or earlier step.',
			placeholder: '42',
			required: true,
		}),
		taskTypeId: activecampaignCommon.taskTypeId,
		title: Property.ShortText({ displayName: 'Title', required: false }),
		note: Property.LongText({ displayName: 'Note', required: false }),
		dateNote: Property.MarkDown({
			value: 'Dates are ISO 8601, in UTC unless you add an offset. A date alone is sent as 12:00 UTC. End Date defaults to 15 minutes after Due Date.',
			variant: MarkdownVariant.INFO,
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			placeholder: '2026-03-01',
			required: true,
			width: 'half',
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Not before the due date.',
			placeholder: '2026-03-02',
			required: false,
			width: 'half',
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
