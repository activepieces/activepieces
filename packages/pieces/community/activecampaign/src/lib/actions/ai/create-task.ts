import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput } from '../../common/ai-props';
import { taskAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createTaskAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_task',
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Creates a task on a contact or deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a task (call, email, …) on a contact (ID or email) or a deal, due at a given time. Get the task type ID from List Task Types and assignee IDs from List Users. Each call creates a task, so do not repeat it; use Complete Task to close one.',
		idempotent: false,
	},
	outputSchema: taskAiOutputSchema,
	props: {
		owner_type: Property.StaticDropdown<string>({
			displayName: 'Attach To',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Deal', value: 'deal' },
				],
			},
		}),
		record_id: Property.ShortText({ displayName: 'Record ID', description: 'The contact ID or email, or the deal ID (List Deals).', required: true }),
		task_type_id: Property.ShortText({ displayName: 'Task Type ID', description: 'Use List Task Types to find the ID.', required: true }),
		due_date: Property.ShortText({
			displayName: 'Due Date',
			description: 'ISO 8601, such as 2026-03-01T09:00:00Z. Times are UTC unless you give an offset (2026-03-01T09:00:00-06:00). A date without a time is sent as 12:00 UTC, which keeps the task on that day for accounts between UTC-11 and UTC+11; for other time zones, give a time with an offset.',
			required: true,
		}),
		end_date: Property.ShortText({ displayName: 'End Date', description: 'Optional ISO 8601, not before Due Date. Times are UTC unless you give an offset; a date alone means 12:00 UTC. Defaults to 15 minutes after the due date.', required: false }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		note: Property.LongText({ displayName: 'Note', required: false }),
		assignee_id: Property.ShortText({ displayName: 'Assignee User ID', description: 'Use List Users to find the ID.', required: false }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const ownerType = aiInput.requireText({ value: propsValue.owner_type, label: 'Attach To' });
		if (ownerType !== 'contact' && ownerType !== 'deal') {
			throw new Error('Attach To must be contact or deal.');
		}
		const duedate = aiInput.isoDateTime({ value: propsValue.due_date, label: 'Due Date', dateOnlyAt: 'noon' });
		if (duedate === undefined) {
			throw new Error('Due Date is required.');
		}
		const edate = aiInput.isoDateTime({ value: propsValue.end_date, label: 'End Date', dateOnlyAt: 'noon' });
		if (edate !== undefined && Date.parse(edate) < Date.parse(duedate)) {
			throw new Error('End Date must not be before Due Date.');
		}
		const dealTask = {
			ownerType,
			relid:
				ownerType === 'contact'
					? await aiInput.resolveContactId({ client, value: propsValue.record_id, label: 'Record ID' })
					: aiInput.numericId({ value: propsValue.record_id, label: 'Record ID' }),
			dealTasktype: aiInput.numericId({ value: propsValue.task_type_id, label: 'Task Type ID' }),
			duedate,
			edate,
			title: aiInput.optionalText(propsValue.title),
			note: aiInput.optionalText(propsValue.note),
			assignee: aiInput.optionalNumericId({ value: propsValue.assignee_id, label: 'Assignee User ID' }),
		};
		const response = await client.request({ method: 'POST', path: '/dealTasks', body: { dealTask } });
		return aiOutput.taskSummary(acData.recordAt({ value: response.body, key: 'dealTask' }));
	},
});
