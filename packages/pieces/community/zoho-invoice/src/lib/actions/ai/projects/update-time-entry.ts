import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const updateTimeEntryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_time_entry',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Update Time Entry',
	description: "Changes a time entry's task, user, date, duration or notes.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a time entry's project, task, user, date, duration, billable flag or notes. Fields left empty keep their current value. Use List Time Entries to find the ID; an invoiced entry may be locked.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		timeEntryId: zohoInvoiceAiProps.timeEntryId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({
			required: false,
			description: 'New project ID. Use List Projects to find it. Empty = unchanged.',
		}),
		taskId: zohoInvoiceAiProps.taskId({
			required: false,
			description: 'New task ID. Use List Tasks to find it. Empty = unchanged.',
		}),
		userId: zohoInvoiceAiProps.userId({
			required: false,
			description: 'New user ID. Use List Project Users to find it. Empty = unchanged.',
		}),
		logDate: Property.ShortText({
			displayName: 'Date',
			description: 'New day the time was spent, as yyyy-mm-dd. Empty = unchanged.',
			required: false,
		}),
		logTime: Property.ShortText({
			displayName: 'Duration',
			description:
				'New time spent, as HH:mm. Empty = unchanged unless Begin Time or End Time is set.',
			required: false,
		}),
		beginTime: Property.ShortText({
			displayName: 'Begin Time',
			description: 'New start time, as HH:mm. Empty = unchanged.',
			required: false,
		}),
		endTime: Property.ShortText({
			displayName: 'End Time',
			description: 'New end time, as HH:mm. Empty = unchanged.',
			required: false,
		}),
		isBillable: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Billable',
			description: 'Whether the time can be billed to the customer. Empty = unchanged.',
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New notes. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, timeEntryId } = propsValue;
		const current = await zohoInvoiceApi.getTimeEntry({ auth, organizationId, timeEntryId });
		const entry = current.time_entry;
		const timeGiven =
			propsValue.logTime !== undefined ||
			propsValue.beginTime !== undefined ||
			propsValue.endTime !== undefined;
		return await zohoInvoiceApi.updateTimeEntry({
			auth,
			organizationId,
			timeEntryId,
			body: zohoInvoiceUtils.compact({
				project_id: propsValue.projectId ?? entry?.project_id,
				task_id: propsValue.taskId ?? entry?.task_id,
				user_id: propsValue.userId ?? entry?.user_id,
				log_date: propsValue.logDate ?? entry?.log_date,
				log_time: timeGiven ? propsValue.logTime : entry?.log_time,
				begin_time: propsValue.beginTime,
				end_time: propsValue.endTime,
				is_billable:
					zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.isBillable }) ??
					entry?.is_billable,
				notes: propsValue.notes ?? entry?.notes,
			}),
		});
	},
});
